"""
Serviço de dividendos da B3 via BrAPI.
Retorna o histórico de proventos pagos por ticker com cache de 2 horas.
"""

import httpx
import logging
from typing import Optional
from app.core.cache import cache
from app.core.config import settings

logger = logging.getLogger(__name__)
BRAPI_BASE = "https://brapi.dev/api"


async def get_dividends(ticker: str, months: int = 12) -> list[dict]:
    """
    Retorna histórico de dividendos/proventos de um ticker.
    Estrutura de cada item:
    { date, dividend_type, value }
    """
    ticker = ticker.upper().strip()
    cache_key = f"dividends:{ticker}:{months}"

    hit = cache.get(cache_key)
    if hit is not None:
        return hit

    result = await _fetch_brapi_dividends(ticker, months)
    cache.set(cache_key, result, settings.CACHE_TTL_DIVIDENDS)
    return result


async def get_portfolio_dividends(tickers: list[str]) -> dict[str, list[dict]]:
    """Busca dividendos de múltiplos tickers (um por vez, com cache)."""
    results = {}
    for ticker in tickers:
        results[ticker.upper()] = await get_dividends(ticker)
    return results


async def _fetch_brapi_dividends(ticker: str, months: int) -> list[dict]:
    try:
        params = {
            "range": f"{months}mo",
            "dividends": "true",
            "fundamental": "false",
        }
        if settings.BRAPI_TOKEN:
            params["token"] = settings.BRAPI_TOKEN

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{BRAPI_BASE}/quote/{ticker}", params=params)
            resp.raise_for_status()
            data = resp.json()

        results = data.get("results", [])
        if not results:
            return []

        dividends_raw = results[0].get("dividendsData", {}).get("cashDividends", [])
        parsed = []
        for d in dividends_raw:
            parsed.append({
                "date": d.get("paymentDate") or d.get("approvedOn", ""),
                "dividend_type": d.get("label", "Dividendo"),
                "value": float(d.get("rate", 0)),
            })
        return sorted(parsed, key=lambda x: x["date"], reverse=True)

    except Exception as e:
        logger.warning(f"Dividends fetch error ({ticker}): {e}")
        return []
