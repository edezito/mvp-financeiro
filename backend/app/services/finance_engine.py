"""
Motor de cálculo financeiro do ecossistema B3.

Responsabilidades:
- Valorização nominal e percentual de cada ativo
- Rentabilidade real via Equação de Fisher
- Ranking de ativos (top ganhos / top perdas)
- Cálculo de peso no portfólio
- Projeção de meta de investimento
"""

from decimal import Decimal
from typing import Optional


# ─────────────────────────────────────────────
#  Valorização de ativo individual
# ─────────────────────────────────────────────

def calc_asset_performance(
    avg_price: float,
    current_price: float,
    quantity: float,
    ipca_12m_pct: float,
) -> dict:
    """
    Retorna todas as métricas de desempenho de um ativo.

    Fórmulas:
      gain_pct   = ((P_atual - P_compra) / P_compra) × 100
      gain_nom   = (P_atual - P_compra) × quantidade
      real_pct   = ((1 + gain_pct/100) / (1 + IPCA/100) - 1) × 100  [Fisher]
    """
    if avg_price <= 0:
        return _zero_performance()

    current_value = current_price * quantity
    cost_basis = avg_price * quantity

    gain_pct = ((current_price - avg_price) / avg_price) * 100
    gain_nominal = current_value - cost_basis

    # Equação de Fisher — rentabilidade real
    real_pct = ((1 + gain_pct / 100) / (1 + ipca_12m_pct / 100) - 1) * 100

    return {
        "current_price": round(current_price, 2),
        "current_value": round(current_value, 2),
        "cost_basis": round(cost_basis, 2),
        "gain_pct": round(gain_pct, 2),
        "gain_nominal": round(gain_nominal, 2),
        "real_pct": round(real_pct, 2),
        "is_positive": gain_pct >= 0,
    }


def _zero_performance() -> dict:
    return {
        "current_price": 0.0,
        "current_value": 0.0,
        "cost_basis": 0.0,
        "gain_pct": 0.0,
        "gain_nominal": 0.0,
        "real_pct": 0.0,
        "is_positive": True,
    }


# ─────────────────────────────────────────────
#  Portfólio completo
# ─────────────────────────────────────────────

def enrich_portfolio(
    assets: list[dict],
    quotes: dict[str, Optional[dict]],
    ipca_12m: float,
) -> dict:
    """
    Recebe lista de assets do banco + cotações ao vivo e retorna
    o portfólio enriquecido com métricas, ranking e totais.

    assets[i] deve ter: ticker, quantity (float), avg_price (float), name
    quotes[ticker] deve ter: price, change_percent, change_nominal, name
    """
    enriched = []
    total_invested = 0.0
    total_current = 0.0

    for asset in assets:
        ticker = asset["ticker"].upper()
        qty = float(asset["quantity"])
        avg = float(asset["avg_price"])
        quote = quotes.get(ticker)
        current_price = float(quote["price"]) if quote else avg  # fallback = custo

        perf = calc_asset_performance(avg, current_price, qty, ipca_12m)

        enriched.append({
            "id": str(asset.get("id", "")),
            "ticker": ticker,
            "name": quote.get("name") if quote else asset.get("name") or ticker,
            "quantity": qty,
            "avg_price": avg,
            "current_price": perf["current_price"],
            "current_value": perf["current_value"],
            "cost_basis": perf["cost_basis"],
            "gain_pct": perf["gain_pct"],
            "gain_nominal": perf["gain_nominal"],
            "real_pct": perf["real_pct"],
            "is_positive": perf["is_positive"],
            "change_today_pct": float(quote["change_percent"]) if quote else 0.0,
            "change_today_nom": float(quote["change_nominal"]) if quote else 0.0,
            "quote_available": quote is not None,
            "weight_pct": 0.0,  # preenchido abaixo
        })

        total_invested += perf["cost_basis"]
        total_current += perf["current_value"]

    # Peso de cada ativo no portfólio
    for item in enriched:
        item["weight_pct"] = round(
            (item["current_value"] / total_current * 100) if total_current > 0 else 0.0, 2
        )

    # Totais
    total_gain_nominal = total_current - total_invested
    total_gain_pct = (
        ((total_current - total_invested) / total_invested * 100)
        if total_invested > 0 else 0.0
    )
    total_real_pct = (
        ((1 + total_gain_pct / 100) / (1 + ipca_12m / 100) - 1) * 100
        if total_invested > 0 else 0.0
    )

    # Ranking
    sorted_by_gain = sorted(enriched, key=lambda x: x["gain_pct"], reverse=True)
    top3_winners = sorted_by_gain[:3]
    top3_losers = sorted_by_gain[-3:][::-1] if len(sorted_by_gain) >= 3 else []

    return {
        "assets": enriched,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_current_value": round(total_current, 2),
            "total_gain_nominal": round(total_gain_nominal, 2),
            "total_gain_pct": round(total_gain_pct, 2),
            "total_real_pct": round(total_real_pct, 2),
            "asset_count": len(enriched),
            "is_positive": total_gain_pct >= 0,
        },
        "ranking": {
            "top_winners": top3_winners,
            "top_losers": top3_losers,
        },
    }


# ─────────────────────────────────────────────
#  Metas de investimento
# ─────────────────────────────────────────────

def calc_goal_progress(
    current_value: float,
    target_value: float,
    monthly_contribution: float = 0.0,
    monthly_return_pct: float = 1.0,
) -> dict:
    """
    Calcula progresso de uma meta financeira e projeção de meses
    para atingi-la (com aportes mensais e juros compostos).
    """
    if target_value <= 0:
        return {"progress_pct": 100.0, "months_to_goal": 0, "on_track": True}

    progress_pct = min((current_value / target_value) * 100, 100.0)
    remaining = target_value - current_value

    months_to_goal = None
    if monthly_contribution > 0 and remaining > 0:
        r = monthly_return_pct / 100
        # FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r  → resolve numericamente
        pv = current_value
        months_to_goal = 0
        while pv < target_value and months_to_goal < 600:
            pv = pv * (1 + r) + monthly_contribution
            months_to_goal += 1
        if months_to_goal >= 600:
            months_to_goal = None

    return {
        "progress_pct": round(progress_pct, 1),
        "remaining": round(remaining, 2),
        "months_to_goal": months_to_goal,
        "on_track": progress_pct >= 50.0,
    }
