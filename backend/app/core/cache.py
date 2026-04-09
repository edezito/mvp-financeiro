"""
Cache in-memory simples com TTL.
Não requer Redis — adequado para o MVP com uma única instância.
Em produção, substitua por Redis com o mesmo contrato de interface.
"""

import time
import threading
from typing import Any, Optional


class TTLCache:
    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.time() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: int) -> None:
        with self._lock:
            self._store[key] = (value, time.time() + ttl)

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear_prefix(self, prefix: str) -> int:
        with self._lock:
            keys = [k for k in self._store if k.startswith(prefix)]
            for k in keys:
                del self._store[k]
            return len(keys)

    def stats(self) -> dict:
        with self._lock:
            now = time.time()
            total = len(self._store)
            expired = sum(1 for _, (_, exp) in self._store.items() if now > exp)
            return {"total_keys": total, "expired_keys": expired, "live_keys": total - expired}


# Instância global — importada pelos serviços
cache = TTLCache()
