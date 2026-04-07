import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Espera o estado de autenticação resolver (resolve o problema do currentUser
// ser null durante o reload da página, antes do onAuthStateChanged disparar)
function waitForAuth(timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (auth?.currentUser) return resolve(true);

    const unsub = auth?.onAuthStateChanged((user) => {
      clearTimeout(timer);
      unsub?.();
      resolve(!!user);
    });

    const timer = setTimeout(() => {
      unsub?.();
      resolve(!!auth?.currentUser);
    }, timeoutMs);
  });
}

// Interceptor: injeta o Firebase ID Token em toda requisição autenticada
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const hasUser = await waitForAuth();
    if (hasUser && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // token expirado — AuthContext vai tratar o logout
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
      // Dispara evento customizado para o AuthContext capturar
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
