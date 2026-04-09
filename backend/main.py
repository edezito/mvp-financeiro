from backend.app.core import cache
from backend.app.routers import b3, gamification
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, check_db_connection
from app.models.transaction import Transaction, TransactionType
from app.models.asset import Asset
from app.routers import finance, portfolio

# Cria tabelas automaticamente no banco (idempotente)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MVP Financeiro API",
    description="Backend do sistema de gestão financeira e portfólio.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- CORS dinâmico ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(finance.router)
app.include_router(portfolio.router)
app.include_router(b3.router)
app.include_router(gamification.router)



@app.get("/health", tags=["infra"])
async def health_check():
    """Verifica saúde da API e conexão com o banco de dados."""
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "environment": settings.ENVIRONMENT,
        "cache": cache.stats(),
    }


@app.get("/", tags=["infra"])
async def root():
    return {"message": "MVP Financeiro API — acesse /docs para a documentação."}
