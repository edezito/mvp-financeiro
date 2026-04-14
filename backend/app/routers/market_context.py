"""
Router de Contexto de Mercado.
Expõe notícias recentes e sentimento para um ticker via Finnhub.
"""

from fastapi import APIRouter, Depends, Path
from app.core.auth import get_current_user
from app.services.market_news_service import get_market_context

router = APIRouter(prefix="/api/market-context", tags=["market-context"])


@router.get(
    "/{ticker}",
    summary="Notícias recentes e sentimento de mercado para um ticker",
    response_description=(
        "Retorna as 3 notícias mais recentes e a tendência "
        "(bullish/bearish/neutral) do ativo solicitado."
    ),
)
async def get_ticker_market_context(
    ticker: str = Path(
        ...,
        min_length=1,
        max_length=20,
        description="Ticker do ativo. Ex: PETR4, AAPL, VALE3",
    ),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Retorna contexto de mercado para o ticker informado:
    - **sentiment**: `bullish` | `bearish` | `neutral`
    - **sentiment_label**: rótulo em português
    - **news**: lista com até 3 notícias recentes (headline, source, url, summary)
    - **cached**: indica se o resultado veio do cache local
    - **source**: `finnhub` | `fallback`
    """
    return await get_market_context(ticker)