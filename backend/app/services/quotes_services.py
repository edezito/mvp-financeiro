"""
Serviço de cotações da B3 usando BrAPI (https://brapi.dev).
- Conta gratuita: ~15 req/min. O cache de 5 min resolve com folga.
- Fallback automático para HG Brasil Finance se BrAPI falhar.
"""

import httpx
import logging
from typing import Optional
from app.core.cache import cache
from app.core.config import settings

logger = logging.getLogger(__name__)

BRAPI_BASE = "https://brapi.dev/api"
HG_BASE = "https://api.hgbrasil.com/finance/stock_price"

_HTTP_TIMEOUT = 10.0


async def get_quote(ticker: str) -> Optional[dict]:
    """
    Retorna cotação de um ticker B3.
    Estrutura retornada:
    {
        ticker, name, price, change_percent, change_nominal,
        open, high, low, prev_close, volume, market_cap,
        source, cached
    }
    """
    ticker = ticker.upper().strip()
    cache_key = f"quote:{ticker}"

    hit = cache.get(cache_key)
    if hit:
        hit["cached"] = True
        return hit

    result = await _fetch_brapi(ticker)
    if result is None:
        result = await _fetch_hg(ticker)
    if result is None:
        return None

    result["cached"] = False
    cache.set(cache_key, result, settings.CACHE_TTL_QUOTE)
    return result


async def get_quotes_batch(tickers: list[str]) -> dict[str, Optional[dict]]:
    """Busca múltiplos tickers em uma única chamada à BrAPI (até 20 por vez)."""
    if not tickers:
        return {}

    tickers = [t.upper().strip() for t in tickers]
    result: dict[str, Optional[dict]] = {}
    missing: list[str] = []

    # Verifica cache primeiro
    for t in tickers:
        hit = cache.get(f"quote:{t}")
        if hit:
            hit["cached"] = True
            result[t] = hit
        else:
            missing.append(t)

    if not missing:
        return result

    # Busca em lote os que faltam
    try:
        joined = ",".join(missing[:20])
        params = {"token": settings.BRAPI_TOKEN} if settings.BRAPI_TOKEN else {}
        params["fundamental"] = "false"
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.get(f"{BRAPI_BASE}/quote/{joined}", params=params)
            resp.raise_for_status()
            data = resp.json()

        for item in data.get("results", []):
            parsed = _parse_brapi_item(item)
            if parsed:
                cache.set(f"quote:{parsed['ticker']}", parsed, settings.CACHE_TTL_QUOTE)
                parsed["cached"] = False
                result[parsed["ticker"]] = parsed

    except Exception as e:
        logger.warning(f"BrAPI batch error: {e}")
        # Fallback individual para os que ainda faltam
        for t in missing:
            if t not in result:
                result[t] = await _fetch_hg(t)

    # Garante que todos os tickers solicitados têm entrada no resultado
    for t in tickers:
        if t not in result:
            result[t] = None

    return result


async def _fetch_brapi(ticker: str) -> Optional[dict]:
    try:
        params = {"token": settings.BRAPI_TOKEN} if settings.BRAPI_TOKEN else {}
        params["fundamental"] = "false"
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.get(f"{BRAPI_BASE}/quote/{ticker}", params=params)
            resp.raise_for_status()
            data = resp.json()

        results = data.get("results", [])
        if not results:
            return None
        return _parse_brapi_item(results[0])
    except Exception as e:
        logger.warning(f"BrAPI single fetch error ({ticker}): {e}")
        return None


def _parse_brapi_item(item: dict) -> Optional[dict]:
    try:
        price = item.get("regularMarketPrice")
        if price is None:
            return None
        prev = item.get("regularMarketPreviousClose") or price
        change_nominal = round(price - prev, 4)
        change_pct = round((change_nominal / prev) * 100, 2) if prev else 0.0

        return {
            "ticker": item.get("symbol", "").upper(),
            "name": item.get("longName") or item.get("shortName") or "",
            "price": float(price),
            "change_percent": float(item.get("regularMarketChangePercent", change_pct)),
            "change_nominal": float(item.get("regularMarketChange", change_nominal)),
            "open": float(item.get("regularMarketOpen") or 0),
            "high": float(item.get("regularMarketDayHigh") or 0),
            "low": float(item.get("regularMarketDayLow") or 0),
            "prev_close": float(prev),
            "volume": int(item.get("regularMarketVolume") or 0),
            "market_cap": float(item.get("marketCap") or 0),
            "source": "brapi",
        }
    except Exception as e:
        logger.warning(f"BrAPI parse error: {e}")
        return None


async def _fetch_hg(ticker: str) -> Optional[dict]:
    """Fallback: HG Brasil Finance."""
    try:
        params = {"key": settings.HG_BRASIL_KEY or "demo", "symbol": ticker}
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.get(HG_BASE, params=params)
            resp.raise_for_status()
            data = resp.json()

        results = data.get("results", {})
        item = results.get(ticker, {})
        if not item:
            return None

        price = float(item.get("price", 0))
        change_pct = float(item.get("change_percent", 0))
        change_nom = round(price * change_pct / 100, 4)

        return {
            "ticker": ticker,
            "name": item.get("name", ""),
            "price": price,
            "change_percent": change_pct,
            "change_nominal": change_nom,
            "open": float(item.get("market_time", {}).get("open", 0) if isinstance(item.get("market_time"), dict) else 0),
            "high": 0.0,
            "low": 0.0,
            "prev_close": round(price - change_nom, 4),
            "volume": 0,
            "market_cap": 0.0,
            "source": "hgbrasil",
        }
    except Exception as e:
        logger.warning(f"HG Brasil fallback error ({ticker}): {e}")
        return None
