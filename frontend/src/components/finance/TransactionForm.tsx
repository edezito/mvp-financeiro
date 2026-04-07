"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useFinanceStore } from "@/contexts/financeStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { TRANSACTION_CATEGORY_LABELS } from "@/lib/utils";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.enum([
    "salary",
    "investment",
    "freelance",
    "food",
    "transport",
    "housing",
    "health",
    "education",
    "entertainment",
    "other",
  ]),
  description: z.string().min(1, "Descrição obrigatória").max(255),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  date: z.string().min(1, "Data obrigatória"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess?: () => void;
}

const categoryOptions = Object.entries(TRANSACTION_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
);

export function TransactionForm({ onSuccess }: Props) {
  const { addTransaction, loading, error, clearError } = useFinanceStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "expense",
      category: "other",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await addTransaction({
        ...data,
        date: new Date(data.date + "T12:00:00").toISOString(),
      });
      reset();
      onSuccess?.();
    } catch {
      // erro já está no store
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <ErrorAlert message={error} onClose={clearError} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="type"
          label="Tipo"
          {...register("type")}
          error={errors.type?.message}
          options={[
            { value: "income", label: "💰 Receita" },
            { value: "expense", label: "💸 Despesa" },
          ]}
        />
        <Select
          id="category"
          label="Categoria"
          {...register("category")}
          error={errors.category?.message}
          options={categoryOptions}
        />
      </div>

      <Input
        id="description"
        label="Descrição"
        placeholder="Ex: Salário mensal, Aluguel..."
        {...register("description")}
        error={errors.description?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="amount"
          label="Valor (R$)"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0,00"
          {...register("amount")}
          error={errors.amount?.message}
        />
        <Input
          id="date"
          label="Data"
          type="date"
          {...register("date")}
          error={errors.date?.message}
        />
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Adicionar Transação
      </Button>
    </form>
  );
}
