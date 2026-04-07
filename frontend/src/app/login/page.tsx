"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { TrendingUp } from "lucide-react";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email, password }: FormData) => {
    setAuthError(null);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password") {
        setAuthError("E-mail ou senha incorretos.");
      } else if (code === "auth/email-already-in-use") {
        setAuthError("Este e-mail já está cadastrado.");
      } else {
        setAuthError("Ocorreu um erro. Tente novamente.");
      }
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch {
      setAuthError("Erro ao entrar com Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">MVP Financeiro</h1>
            <p className="text-sm text-gray-500">
              {mode === "login"
                ? "Entre na sua conta"
                : "Crie sua conta gratuitamente"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {authError && (
            <ErrorAlert
              message={authError}
              onClose={() => setAuthError(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              {...register("email")}
              error={errors.email?.message}
            />
            <Input
              id="password"
              label="Senha"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              error={errors.password?.message}
            />
            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full"
              size="lg"
            >
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">ou continue com</span>
            </div>
          </div>

          <Button
            variant="secondary"
            loading={googleLoading}
            onClick={handleGoogle}
            className="w-full"
            size="lg"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </Button>

          <p className="mt-5 text-center text-sm text-gray-500">
            {mode === "login" ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setAuthError(null); }}
              className="font-medium text-brand-600 hover:underline"
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
