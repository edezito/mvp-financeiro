"""
Router principal do Ecossistema B3.
Todos os endpoints requerem autenticação Firebase.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.cache import cache
from app.models.asset import Asset
from app.services import quotes_service, macro_service, dividends_service
from app.services.finance_engine import enrich_portfolio, calc_goal_progress

router = APIRouter(prefix="/api/v1/b3", tags=["b3"])


# ─────────────────────────────────────────────
#  Portfólio enriquecido (endpoint principal)
# ─────────────────────────────────────────────

@router.get("/portfolio", summary="Portfólio com cotações ao vivo e métricas")
async def get_enriched_portfolio(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retorna todos os ativos do usuário enriquecidos com:
    - Preço atual (BrAPI)
    - Valorização % e nominal
    - Rentabilidade real (Fisher/IPCA)
    - Variação do dia
    - Ranking top winners/losers
    - Totais do portfólio
    """
    uid = current_user["uid"]

    assets_db = db.query(Asset).filter(Asset.user_id == uid).all()
    if not assets_db:
        return {
            "assets": [], "summary": _empty_summary(), "ranking": {"top_winners": [], "top_losers": []}
        }

    assets_list = [
        {
            "id": str(a.id),
            "ticker": a.ticker,
            "name": a.name,
            "quantity": float(a.quantity),
            "avg_price": float(a.avg_price),
        }
        for a in assets_db
    ]

    tickers = [a["ticker"] for a in assets_list]

    # Busca cotações e macro em paralelo
    import asyncio
    quotes_task = quotes_service.get_quotes_batch(tickers)
    macro_task = macro_service.get_macro_data()
    quotes, macro = await asyncio.gather(quotes_task, macro_task)

    result = enrich_portfolio(assets_list, quotes, macro["ipca_12m"])
    result["macro"] = macro
    return result


# ─────────────────────────────────────────────
#  Cotação individual
# ─────────────────────────────────────────────

@router.get("/quote/{ticker}", summary="Cotação ao vivo de um ticker")
async def get_quote(
    ticker: str,
    current_user: dict = Depends(get_current_user),
):
    result = await quotes_service.get_quote(ticker)
    if result is None:
        from fastapi import HTTPException
        raise HTTPException(404, f"Ticker '{ticker.upper()}' não encontrado.")
    return result


@router.get("/quotes", summary="Cotações de múltiplos tickers")
async def get_quotes(
    tickers: str = Query(..., description="Tickers separados por vírgula. Ex: PETR4,VALE3,ITUB4"),
    current_user: dict = Depends(get_current_user),
):
    ticker_list = [t.strip() for t in tickers.split(",") if t.strip()]
    return await quotes_service.get_quotes_batch(ticker_list)


# ─────────────────────────────────────────────
#  Dados Macroeconômicos
# ─────────────────────────────────────────────

@router.get("/macro", summary="SELIC, IPCA e rentabilidade real via Banco Central")
async def get_macro(
    current_user: dict = Depends(get_current_user),
):
    return await macro_service.get_macro_data()


@router.get("/macro/ipca-history", summary="Histórico mensal do IPCA")
async def get_ipca_history(
    months: int = Query(12, ge=3, le=60),
    current_user: dict = Depends(get_current_user),
):
    return await macro_service.get_ipca_monthly_history(months)


# ─────────────────────────────────────────────
#  Dividendos
# ─────────────────────────────────────────────

@router.get("/dividends/{ticker}", summary="Histórico de dividendos de um ticker")
async def get_dividends(
    ticker: str,
    months: int = Query(12, ge=1, le=60),
    current_user: dict = Depends(get_current_user),
):
    return await dividends_service.get_dividends(ticker, months)


@router.get("/dividends", summary="Dividendos de todos os ativos do portfólio")
async def get_portfolio_dividends(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    assets = db.query(Asset.ticker).filter(Asset.user_id == uid).all()
    tickers = [a.ticker for a in assets]
    return await dividends_service.get_portfolio_dividends(tickers)


# ─────────────────────────────────────────────
#  Cache stats (admin / debug)
# ─────────────────────────────────────────────

@router.delete("/cache", summary="Limpa o cache de cotações", tags=["infra"])
async def clear_cache(
    current_user: dict = Depends(get_current_user),
):
    removed = cache.clear_prefix("quote:") + cache.clear_prefix("macro:")
    return {"cleared_keys": removed, "stats": cache.stats()}


def _empty_summary():
    return {
        "total_invested": 0.0,
        "total_current_value": 0.0,
        "total_gain_nominal": 0.0,
        "total_gain_pct": 0.0,
        "total_real_pct": 0.0,
        "asset_count": 0,
        "is_positive": True,
    }
