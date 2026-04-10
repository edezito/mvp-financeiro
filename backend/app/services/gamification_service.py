"""
Serviço de gamificação focado em bem-estar financeiro.
Princípio: recompensar consistência e diversificação,
NUNCA frequência de operações (para evitar overtrading).
"""

from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.investment_goal import InvestmentGoal
from app.models.activity_streak import ActivityStreak


# ─────────────────────────────────────────────
#  Streaks (sequência de atividade saudável)
# ─────────────────────────────────────────────

STREAK_ACTIONS = {
    "portfolio_check":   {"label": "Revisão do portfólio",    "points": 5},
    "diversification":   {"label": "Diversificação realizada", "points": 20},
    "goal_contribution": {"label": "Aporte na meta",           "points": 15},
    "macro_review":      {"label": "Revisou dados macro",      "points": 3},
}


def record_activity(db: Session, user_id: str, action: str) -> dict:
    """
    Registra uma ação do usuário e atualiza o streak.
    Retorna o estado atualizado do streak.
    """
    today = date.today()
    streak = db.query(ActivityStreak).filter_by(user_id=user_id).first()

    if not streak:
        streak = ActivityStreak(
            user_id=user_id,
            current_streak=0,
            longest_streak=0,
            total_points=0,
            last_activity_date=None,
        )
        db.add(streak)

    last = streak.last_activity_date
    points_earned = STREAK_ACTIONS.get(action, {}).get("points", 1)

    if last is None:
        # Primeiro acesso — inicia streak em 1
        streak.current_streak = 1
    elif last == today:
        # Já registrou hoje — apenas soma pontos, não altera streak
        pass
    elif last == today - timedelta(days=1):
        # Dia consecutivo — incrementa streak
        streak.current_streak = (streak.current_streak or 0) + 1
    else:
        # Quebrou a sequência (lacuna > 1 dia) — reseta para 1
        streak.current_streak = 1

    streak.last_activity_date = today
    streak.total_points = (streak.total_points or 0) + points_earned
    streak.longest_streak = max(streak.longest_streak or 0, streak.current_streak)

    db.commit()
    db.refresh(streak)

    return _streak_to_dict(streak, points_earned)


def get_streak(db: Session, user_id: str) -> dict:
    streak = db.query(ActivityStreak).filter_by(user_id=user_id).first()
    if not streak:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "total_points": 0,
            "last_activity_date": None,
            "badge": None,
            "points_earned": 0,
        }
    return _streak_to_dict(streak)


def _streak_to_dict(streak: ActivityStreak, points_earned: int = 0) -> dict:
    badge = None
    cs = streak.current_streak or 0
    if cs >= 30:
        badge = {"icon": "🏆", "label": "Investidor Consistente"}
    elif cs >= 14:
        badge = {"icon": "🥇", "label": "2 semanas seguidas"}
    elif cs >= 7:
        badge = {"icon": "🔥", "label": "1 semana de foco"}

    return {
        "current_streak": cs,
        "longest_streak": streak.longest_streak or 0,
        "total_points": streak.total_points or 0,
        "last_activity_date": (
            streak.last_activity_date.isoformat()
            if streak.last_activity_date
            else None
        ),
        "badge": badge,
        "points_earned": points_earned,
    }


# ─────────────────────────────────────────────
#  Metas de investimento
# ─────────────────────────────────────────────

def get_goals(db: Session, user_id: str) -> list[dict]:
    goals = (
        db.query(InvestmentGoal)
        .filter_by(user_id=user_id)
        .order_by(InvestmentGoal.created_at)
        .all()
    )
    return [_goal_to_dict(g) for g in goals]


def create_goal(db: Session, user_id: str, data: dict) -> dict:
    goal = InvestmentGoal(
        user_id=user_id,
        title=data["title"],
        target_value=data["target_value"],
        current_value=data.get("current_value", 0),
        monthly_contribution=data.get("monthly_contribution", 0),
        deadline=data.get("deadline"),
        emoji=data.get("emoji", "🎯"),
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _goal_to_dict(goal)


def update_goal_value(
    db: Session, user_id: str, goal_id: str, current_value: float
) -> dict:
    goal = (
        db.query(InvestmentGoal)
        .filter_by(id=goal_id, user_id=user_id)
        .first()
    )
    if not goal:
        return {}
    goal.current_value = current_value
    db.commit()
    db.refresh(goal)
    return _goal_to_dict(goal)


def _goal_to_dict(goal: InvestmentGoal) -> dict:
    target = float(goal.target_value)
    current = float(goal.current_value or 0)
    progress = min((current / target * 100), 100.0) if target > 0 else 0.0
    return {
        "id": str(goal.id),
        "title": goal.title,
        "emoji": goal.emoji or "🎯",
        "target_value": target,
        "current_value": current,
        "progress_pct": round(progress, 1),
        "monthly_contribution": float(goal.monthly_contribution or 0),
        "deadline": goal.deadline.isoformat() if goal.deadline else None,
        "created_at": goal.created_at.isoformat(),
        "completed": progress >= 100.0,
    }