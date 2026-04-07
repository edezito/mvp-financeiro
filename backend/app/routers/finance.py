from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from decimal import Decimal
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
    TransactionListResponse,
    BalanceResponse,
)

router = APIRouter(prefix="/api/v1/finance", tags=["finance"])


@router.post(
    "/transactions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Adicionar receita ou despesa",
)
async def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    transaction = Transaction(
        user_id=current_user["uid"],
        type=payload.type,
        category=payload.category,
        description=payload.description,
        amount=payload.amount,
        date=payload.date,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get(
    "/transactions",
    response_model=TransactionListResponse,
    summary="Listar transações do usuário",
)
async def list_transactions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    type: Optional[TransactionType] = Query(None, description="Filtrar por tipo"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user["uid"])

    if type:
        query = query.filter(Transaction.type == type)

    total = query.count()
    transactions = (
        query.order_by(Transaction.date.desc()).offset(offset).limit(limit).all()
    )

    return TransactionListResponse(transactions=transactions, total=total)


@router.get(
    "/balance",
    response_model=BalanceResponse,
    summary="Calcular saldo, total de receitas e despesas",
)
async def get_balance(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]

    total_income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == uid,
            Transaction.type == TransactionType.income,
        )
        .scalar()
    )

    total_expense = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == uid,
            Transaction.type == TransactionType.expense,
        )
        .scalar()
    )

    transaction_count = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.user_id == uid)
        .scalar()
    )

    total_income = Decimal(str(total_income))
    total_expense = Decimal(str(total_expense))

    return BalanceResponse(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        transaction_count=transaction_count,
    )


@router.delete(
    "/transactions/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover uma transação",
)
async def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user["uid"],
        )
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada.")
    db.delete(transaction)
    db.commit()
