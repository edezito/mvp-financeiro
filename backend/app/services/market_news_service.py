"""
Serviço de notícias e sentimento de mercado via Finnhub.
API gratuita: https://finnhub.io/docs/api/company-news

Cache de 30 minutos para respeitar os limites do plano gratuito.
"""

import httpx
import logging
from datetime import date, timedelta
from typing import Optional
from app.core.cache import cache
from app.core.config import settings

logger = logging.getLogger(__name__)

FINNHUB_BASE = "https://finnhub.io/api/v1"
CACHE_TTL_NEWS = 1800  # 30 minutos


# ─────────────────────────────────────────────
#  Tipos de retorno
# ─────────────────────────────────────────────

def _empty_context(ticker: str) -> dict:
    """Retorno seguro quando a API falha ou não há dados."""
    return {
        "ticker": ticker.upper(),
        "sentiment": "neutral",
        "sentiment_label": "Neutro",
        "news": [],
        "source": "fallback",
        "cached": False,
    }


def _classify_sentiment(news_items: list[dict]) -> dict:
    """
    Classifica o sentimento com base nas manchetes recentes.
    Heurística simples: palavras-chave positivas vs negativas.
    """
    POSITIVE_KEYWORDS = {
        "alta", "sobe", "subiu", "lucro", "crescimento", "record",
        "supera", "beat", "rally", "ganho", "positivo", "aprova",
        "expansão", "acordo", "contrato", "dividendo", "buy", "upgrade",
        "strong", "profit", "gain", "rise", "surge", "boom",
    }
    NEGATIVE_KEYWORDS = {
        "queda", "cai", "caiu", "prejuízo", "perda", "negativo",
        "vende", "downgrade", "sell", "weak", "loss", "drop", "fall",
        "risco", "investigação", "multa", "corte", "demissão", "crise",
        "recall", "fraud", "debt", "decline", "crash", "warning",
    }

    positive_score = 0
    negative_score = 0

    for item in news_items:
        headline = (item.get("headline", "") + " " + item.get("summary", "")).lower()
        for word in POSITIVE_KEYWORDS:
            if word in headline:
                positive_score += 1
        for word in NEGATIVE_KEYWORDS:
            if word in headline:
                negative_score += 1

    if positive_score > negative_score:
        return {"sentiment": "bullish", "sentiment_label": "Alta (Bullish)"}
    elif negative_score > positive_score:
        return {"sentiment": "bearish", "sentiment_label": "Baixa (Bearish)"}
    else:
        return {"sentiment": "neutral", "sentiment_label": "Neutro"}


async def get_market_context(ticker: str) -> dict:
    """
    Retorna as 3 notícias mais recentes e o sentimento de mercado
    para um ticker B3/global. Usa cache de 30 minutos.

    Estrutura retornada:
    {
        ticker, sentiment, sentiment_label,
        news: [{ headline, source, url, datetime, summary }],
        source: "finnhub" | "fallback",
        cached: bool
    }
    """
    ticker = ticker.upper().strip()
    cache_key = f"market_news:{ticker}"

    hit = cache.get(cache_key)
    if hit:
        hit["cached"] = True
        return hit

    # Tickers B3 normalmente têm sufixo .SA para o Finnhub
    finnhub_symbol = f"{ticker}.SA" if not ticker.endswith(".SA") else ticker

    result = await _fetch_finnhub_news(finnhub_symbol, ticker)

    # Fallback: tenta sem sufixo .SA (para ações globais como AAPL, MSFT)
    if not result["news"] and ".SA" in finnhub_symbol:
        result = await _fetch_finnhub_news(ticker, ticker)

    if result["news"]:
        cache.set(cache_key, result, CACHE_TTL_NEWS)

    return result


async def _fetch_finnhub_news(symbol: str, original_ticker: str) -> dict:
    """
    Faz a chamada à API do Finnhub e formata o resultado.
    Retorna fallback seguro em caso de erro.
    """
    today = date.today()
    date_from = (today - timedelta(days=7)).isoformat()
    date_to = today.isoformat()

    token = getattr(settings, "FINNHUB_TOKEN", "")
    if not token:
        logger.warning("FINNHUB_TOKEN não configurado. Retornando fallback.")
        return _empty_context(original_ticker)

    try:
        params = {
            "symbol": symbol,
            "from": date_from,
            "to": date_to,
            "token": token,
        }

        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(f"{FINNHUB_BASE}/company-news", params=params)
            resp.raise_for_status()
            raw_news: list[dict] = resp.json()

        if not raw_news:
            return _empty_context(original_ticker)

        # Ordena do mais recente e pega as 3 primeiras
        sorted_news = sorted(raw_news, key=lambda x: x.get("datetime", 0), reverse=True)
        top_3 = sorted_news[:3]

        formatted_news = [
            {
                "headline": item.get("headline", "Sem título"),
                "source": item.get("source", ""),
                "url": item.get("url", ""),
                "datetime": item.get("datetime", 0),
                "summary": item.get("summary", "")[:300],  # limita resumo
            }
            for item in top_3
        ]

        sentiment = _classify_sentiment(formatted_news)

        return {
            "ticker": original_ticker,
            **sentiment,
            "news": formatted_news,
            "source": "finnhub",
            "cached": False,
        }

    except httpx.HTTPStatusError as e:
        logger.warning(
            f"Finnhub HTTP error para {symbol}: {e.response.status_code} — {e.response.text}"
        )
        return _empty_context(original_ticker)

    except httpx.TimeoutException:
        logger.warning(f"Finnhub timeout para {symbol}")
        return _empty_context(original_ticker)

    except Exception as e:
        logger.error(f"Erro inesperado ao buscar notícias Finnhub ({symbol}): {e}")
        return _empty_context(original_ticker)