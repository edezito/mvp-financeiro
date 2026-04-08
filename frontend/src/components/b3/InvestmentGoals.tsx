"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGamificationStore } from "@/contexts/gamificationStore";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Target, Plus, CheckCircle2 } from "lucide-react";
import type { InvestmentGoal } from "@/lib/types";

// ─────────────────────────────────────────────
//  Card de meta individual
// ─────────────────────────────────────────────

const EMOJIS = ["🎯", "🏠", "🚗", "✈️", "📚", "🏦", "💎", "🌴"];

function GoalProgressBar({ goal }: { goal: InvestmentGoal }) {
  const pct = goal.progress_pct;
  const barColor =
    goal.completed
      ? "bg-green-500"
      : pct >= 75
      ? "bg-brand-500"
      : pct >= 40
      ? "bg-blue-500"
      : "bg-gray-400";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>{goal.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{goal.title}</p>
            {goal.deadline && (
              <p className="text-xs text-gray-400">Prazo: {goal.deadline}</p>
            )}
          </div>
        </div>
        {goal.completed && (
          <CheckCircle2
            className="h-5 w-5 flex-shrink-0 text-green-500"
            aria-label="Meta concluída"
          />
        )}
      </div>

      {/* Barra de progresso */}
      <div
        className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={goal.current_value}
        aria-valuemax={goal.target_value}
        aria-label={`${goal.title}: ${pct.toFixed(1)}% concluído`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {formatCurrency(goal.current_value)}{" "}
          <span className="text-gray-300">/</span>{" "}
          {formatCurrency(goal.target_value)}
        </span>
        <span
          className={cn(
            "font-semibold",
            goal.completed ? "text-green-600" : "text-gray-700"
          )}
        >
          {pct.toFixed(1)}%
        </span>
      </div>

      {goal.monthly_contribution > 0 && (
        <p className="mt-1.5 text-xs text-gray-400">
          Aporte mensal: {formatCurrency(goal.monthly_contribution)}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Formulário de nova meta
// ─────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(1, "Título obrigatório").max(120),
  emoji: z.string().default("🎯"),
  target_value: z.coerce.number().positive("Valor deve ser positivo"),
  current_value: z.coerce.number().min(0).default(0),
  monthly_contribution: z.coerce.number().min(0).default(0),
  deadline: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function GoalForm({ onClose }: { onClose: () => void }) {
  const { createGoal, loading, error, clearError } = useGamificationStore();
  const [selectedEmoji, setSelectedEmoji] = useState("🎯");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { emoji: "🎯", current_value: 0, monthly_contribution: 0 },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createGoal({ ...data, emoji: selectedEmoji });
      onClose();
    } catch { /* erro no store */ }
  };

  return (
    <div className="rounded-xl border border-brand-200 bg-white p-5 shadow-sm">
      <p className="mb-4 text-sm font-semibold text-gray-700">Nova meta de investimento</p>
      {error && <ErrorAlert message={error} onClose={clearError} className="mb-3" />}

      <div className="mb-3 flex flex-wrap gap-2">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setSelectedEmoji(e)}
            aria-label={`Ícone ${e}`}
            className={cn(
              "rounded-lg p-2 text-lg transition",
              selectedEmoji === e ? "bg-brand-100 ring-2 ring-brand-400" : "hover:bg-gray-100"
            )}
          >
            {e}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input id="title" label="Título da meta" placeholder="Ex: Reserva de emergência"
          {...register("title")} error={errors.title?.message} />

        <div className="grid grid-cols-2 gap-3">
          <Input id="target_value" label="Valor alvo (R$)" type="number" step="0.01"
            placeholder="100000" {...register("target_value")} error={errors.target_value?.message} />
          <Input id="current_value" label="Valor atual (R$)" type="number" step="0.01"
            placeholder="0" {...register("current_value")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input id="monthly_contribution" label="Aporte mensal (R$)" type="number" step="0.01"
            placeholder="0" {...register("monthly_contribution")} />
          <Input id="deadline" label="Prazo (opcional)" type="date"
            {...register("deadline")} />
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={loading} size="sm">Criar meta</Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Lista de metas
// ─────────────────────────────────────────────

export function InvestmentGoalsPanel() {
  const { goals } = useGamificationStore();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-brand-600" aria-hidden />
          <span className="text-sm font-semibold text-gray-700">Metas financeiras</span>
        </div>
        {!showForm && (
          <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Nova meta
          </Button>
        )}
      </div>

      {showForm && <GoalForm onClose={() => setShowForm(false)} />}

      {!showForm && goals.length === 0 && (
        <div className="flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-gray-200">
          <p className="text-xs text-gray-400">Nenhuma meta criada ainda.</p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {goals.map((g) => (
          <GoalProgressBar key={g.id} goal={g} />
        ))}
      </div>
    </div>
  );
}
