from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from app.models.transaction import TransactionType, TransactionCategory


class TransactionCreate(BaseModel):
    type: TransactionType
    category: TransactionCategory = TransactionCategory.other
    description: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., gt=0, description="Valor positivo. O tipo define se é receita ou despesa.")
    date: datetime


class TransactionResponse(BaseModel):
    id: UUID
    user_id: str
    type: TransactionType
    category: TransactionCategory
    description: str
    amount: Decimal
    date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BalanceResponse(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    transaction_count: int


class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int
