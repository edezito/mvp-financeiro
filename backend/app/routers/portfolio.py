from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from decimal import Decimal

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetResponse, AssetListResponse

router = APIRouter(prefix="/api/v1/portfolio", tags=["portfolio"])


@router.post(
    "/assets",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Comprar/adicionar ativo com cálculo de preço médio",
)
async def add_asset(
    payload: AssetCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    ticker = payload.ticker.upper().strip()

    existing = (
        db.query(Asset)
        .filter(Asset.user_id == uid, Asset.ticker == ticker)
        .first()
    )

    if existing:
        # --- Cálculo de preço médio ponderado ---
        # PM = (qtd_atual * pm_atual + qtd_nova * preco_novo) / (qtd_atual + qtd_nova)
        old_qty = existing.quantity
        old_pm = existing.avg_price
        new_qty = payload.quantity
        new_price = payload.price

        total_qty = old_qty + new_qty
        new_avg_price = ((old_qty * old_pm) + (new_qty * new_price)) / total_qty
        new_total_invested = total_qty * new_avg_price

        existing.quantity = total_qty
        existing.avg_price = round(new_avg_price, 6)
        existing.total_invested = round(new_total_invested, 2)
        if payload.name:
            existing.name = payload.name

        db.commit()
        db.refresh(existing)
        return existing
    else:
        total_invested = payload.quantity * payload.price
        asset = Asset(
            user_id=uid,
            ticker=ticker,
            name=payload.name,
            quantity=payload.quantity,
            avg_price=payload.price,
            total_invested=round(total_invested, 2),
        )
        db.add(asset)
        try:
            db.commit()
        except IntegrityError:
            # FIX: Race condition — outro request inseriu o mesmo ticker
            # simultaneamente. Faz rollback e tenta o caminho de update.
            db.rollback()
            existing = (
                db.query(Asset)
                .filter(Asset.user_id == uid, Asset.ticker == ticker)
                .first()
            )
            if not existing:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Erro ao salvar ativo. Tente novamente.",
                )
            old_qty = existing.quantity
            old_pm = existing.avg_price
            new_qty = payload.quantity
            new_price = payload.price
            total_qty = old_qty + new_qty
            new_avg_price = ((old_qty * old_pm) + (new_qty * new_price)) / total_qty
            existing.quantity = total_qty
            existing.avg_price = round(new_avg_price, 6)
            existing.total_invested = round(total_qty * new_avg_price, 2)
            if payload.name:
                existing.name = payload.name
            db.commit()
            db.refresh(existing)
            return existing

        db.refresh(asset)
        return asset


@router.get(
    "/assets",
    response_model=AssetListResponse,
    summary="Listar carteira de investimentos",
)
async def list_assets(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    assets = (
        db.query(Asset)
        .filter(Asset.user_id == uid)
        .order_by(Asset.ticker)
        .all()
    )

    total_invested = sum(a.total_invested for a in assets) if assets else Decimal("0")

    return AssetListResponse(
        assets=assets,
        total_invested=total_invested,
        asset_count=len(assets),
    )


@router.delete(
    "/assets/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover ativo da carteira",
)
async def delete_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    asset = (
        db.query(Asset)
        .filter(Asset.id == asset_id, Asset.user_id == current_user["uid"])
        .first()
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Ativo não encontrado.")
    db.delete(asset)
    db.commit()
