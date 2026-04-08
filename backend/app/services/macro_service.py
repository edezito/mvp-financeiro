"""
Serviço de dados macroeconômicos do SGS (Sistema Gerenciador de Séries Temporais)
do Banco Central do Brasil. API completamente gratuita e sem autenticação.

Séries utilizadas:
  432  → Taxa Selic Over (% a.a.) — diária
  13522 → IPCA acumulado 12 meses (% a.a.) — mensal
  11426 → IPCA mês a mês — mensal
"""

import httpx
import logging
from typing import Optional
from app.core.cache import cache
from app.core.config import settings

logger = logging.getLogger(__name__)

SGS_BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados/ultimos/{n}?formato=json"

SERIE_SELIC = 432
SERIE_IPCA_12M = 13522
SERIE_IPCA_MES = 11426


async def get_macro_data() -> dict:
    """
    Retorna SELIC e IPCA do Banco Central com cache de 1 hora.
    Estrutura:
    {
        selic_aa, ipca_12m, ipca_mes,
        real_yield_fisher,   # rentabilidade real anualizada pela Equação de Fisher
        cached
    }
    """
    cache_key = "macro:bcb"
    hit = cache.get(cache_key)
    if hit:
        hit["cached"] = True
        return hit

    selic = await _fetch_serie(SERIE_SELIC, n=1)
    ipca_12m = await _fetch_serie(SERIE_IPCA_12M, n=1)
    ipca_mes = await _fetch_serie(SERIE_IPCA_MES, n=1)

    selic_val = _last_value(selic) or 10.5
    ipca_12m_val = _last_value(ipca_12m) or 4.8
    ipca_mes_val = _last_value(ipca_mes) or 0.4

    # Equação de Fisher: r_real = ((1 + r_nominal) / (1 + r_inflacao)) - 1
    r_real = ((1 + selic_val / 100) / (1 + ipca_12m_val / 100) - 1) * 100

    result = {
        "selic_aa": round(selic_val, 2),
        "ipca_12m": round(ipca_12m_val, 2),
        "ipca_mes": round(ipca_mes_val, 2),
        "real_yield_fisher": round(r_real, 2),
        "cached": False,
    }

    cache.set(cache_key, result, settings.CACHE_TTL_MACRO)
    return result


async def get_ipca_monthly_history(months: int = 12) -> list[dict]:
    """Retorna histórico mensal do IPCA para o gráfico de inflação."""
    cache_key = f"macro:ipca_hist:{months}"
    hit = cache.get(cache_key)
    if hit:
        return hit

    data = await _fetch_serie(SERIE_IPCA_MES, n=months)
    result = [{"date": item["data"], "value": float(item["valor"])} for item in (data or [])]

    cache.set(cache_key, result, settings.CACHE_TTL_MACRO)
    return result


def calculate_real_return(nominal_return_pct: float, ipca_12m_pct: float) -> float:
    """
    Equação de Fisher para retorno real de um ativo específico.
    nominal_return_pct: ganho do ativo em % (ex: 12.5)
    ipca_12m_pct: IPCA acumulado 12m em % (ex: 4.8)
    Retorna: retorno real anualizado em %
    """
    r_nominal = nominal_return_pct / 100
    r_ipca = ipca_12m_pct / 100
    r_real = ((1 + r_nominal) / (1 + r_ipca) - 1) * 100
    return round(r_real, 2)


async def _fetch_serie(serie: int, n: int = 1) -> Optional[list]:
    url = SGS_BASE.format(serie=serie, n=n)
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.warning(f"SGS Banco Central error (serie={serie}): {e}")
        return None


def _last_value(data: Optional[list]) -> Optional[float]:
    if not data:
        return None
    try:
        return float(data[-1]["valor"].replace(",", "."))
    except Exception:
        return None
