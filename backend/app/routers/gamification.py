from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.gamification_service import (
    get_streak, record_activity,
    get_goals, create_goal, update_goal_value,
    STREAK_ACTIONS,
)

router = APIRouter(prefix="/api/v1/gamification", tags=["gamification"])


# ─────────────────────────────────────────────
#  Streaks
# ─────────────────────────────────────────────

@router.get("/streak", summary="Estado atual do streak do usuário")
async def get_user_streak(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return get_streak(db, current_user["uid"])


class ActivityPayload(BaseModel):
    action: str = Field(..., description=f"Uma de: {list(STREAK_ACTIONS.keys())}")


@router.post("/streak/activity", summary="Registrar atividade saudável")
async def register_activity(
    payload: ActivityPayload,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if payload.action not in STREAK_ACTIONS:
        raise HTTPException(400, f"Ação inválida. Válidas: {list(STREAK_ACTIONS.keys())}")
    return record_activity(db, current_user["uid"], payload.action)


# ─────────────────────────────────────────────
#  Metas
# ─────────────────────────────────────────────

class GoalCreatePayload(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    emoji: str = "🎯"
    target_value: float = Field(..., gt=0)
    current_value: float = 0.0
    monthly_contribution: float = 0.0
    deadline: Optional[date] = None


class GoalUpdatePayload(BaseModel):
    current_value: float = Field(..., ge=0)


@router.get("/goals", summary="Listar metas de investimento")
async def list_goals(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return get_goals(db, current_user["uid"])


@router.post("/goals", status_code=201, summary="Criar meta de investimento")
async def add_goal(
    payload: GoalCreatePayload,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return create_goal(db, current_user["uid"], payload.model_dump())


@router.patch("/goals/{goal_id}", summary="Atualizar valor atual de uma meta")
async def patch_goal(
    goal_id: str,
    payload: GoalUpdatePayload,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = update_goal_value(db, current_user["uid"], goal_id, payload.current_value)
    if not result:
        raise HTTPException(404, "Meta não encontrada.")
    return result
