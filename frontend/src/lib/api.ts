import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

/**
 * FIX: Timeout reduzido para 3s (era 5s) para não travar a UI.
 * Também adicionada guarda explícita de `auth` undefined (SSR safety).
 */
function waitForAuth(timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    // auth pode ser undefined se o Firebase não inicializou (SSR/build)
    if (!auth) return resolve(false);
    if (auth.currentUser) return resolve(true);

    const timer = setTimeout(() => {
      unsub?.();
      resolve(!!auth?.currentUser);
    }, timeoutMs);

    const unsub = auth.onAuthStateChanged((user) => {
      clearTimeout(timer);
      unsub();
      resolve(!!user);
    });
  });
}

// Interceptor: injeta o Firebase ID Token em toda requisição autenticada
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined" && auth) {
    const hasUser = await waitForAuth();
    if (hasUser && auth.currentUser) {
      try {
        // FIX: forceRefresh=false evita request desnecessária ao Firebase;
        // o SDK já renova o token automaticamente quando próximo de expirar.
        const token = await auth.currentUser.getIdToken(false);
        config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // token expirado — AuthContext vai tratar o logout via evento
      }
    }
  }
  return config;
});

// Interceptor de resposta: trata erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;