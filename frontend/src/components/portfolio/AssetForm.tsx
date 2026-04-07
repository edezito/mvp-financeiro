"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePortfolioStore } from "@/contexts/portfolioStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

const schema = z.object({
  ticker: z.string().min(1, "Ticker obrigatório").max(20).toUpperCase(),
  name: z.string().max(100).optional(),
  quantity: z.coerce.number().positive("Quantidade deve ser positiva"),
  price: z.coerce.number().positive("Preço deve ser positivo"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess?: () => void;
}

export function AssetForm({ onSuccess }: Props) {
  const { addAsset, loading, error, clearError } = usePortfolioStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await addAsset({
        ticker: data.ticker.toUpperCase().trim(),
        name: data.name || undefined,
        quantity: data.quantity,
        price: data.price,
      });
      reset();
      onSuccess?.();
    } catch {
      // erro já está no store
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <ErrorAlert message={error} onClose={clearError} />}

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="ticker"
          label="Ticker"
          placeholder="Ex: PETR4, AAPL, BTC"
          {...register("ticker")}
          error={errors.ticker?.message}
          className="uppercase"
        />
        <Input
          id="name"
          label="Nome do ativo (opcional)"
          placeholder="Ex: Petrobras PN"
          {...register("name")}
          error={errors.name?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="quantity"
          label="Quantidade"
          type="number"
          step="0.000001"
          min="0.000001"
          placeholder="0"
          {...register("quantity")}
          error={errors.quantity?.message}
        />
        <Input
          id="price"
          label="Preço unitário (R$)"
          type="number"
          step="0.000001"
          min="0.000001"
          placeholder="0,00"
          {...register("price")}
          error={errors.price?.message}
        />
      </div>

      <div className="rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700">
        💡 Se já existir esse ticker na sua carteira, o preço médio será calculado
        automaticamente.
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Adicionar à Carteira
      </Button>
    </form>
  );
}
