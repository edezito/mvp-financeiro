from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from uuid import UUID


class AssetCreate(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=20, description="Ex: PETR4, AAPL, BTC")
    name: Optional[str] = Field(None, max_length=100, description="Nome do ativo")
    quantity: Decimal = Field(..., gt=0, description="Quantidade comprada nesta operação")
    price: Decimal = Field(..., gt=0, description="Preço unitário desta compra")


class AssetResponse(BaseModel):
    id: UUID
    user_id: str
    ticker: str
    name: Optional[str]
    quantity: Decimal
    avg_price: Decimal
    total_invested: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AssetListResponse(BaseModel):
    assets: List[AssetResponse]
    total_invested: Decimal
    asset_count: int
