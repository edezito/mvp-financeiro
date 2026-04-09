"use client";

import { useGamificationStore } from "@/contexts/gamificationStore";
import { Flame, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakCard() {
  const { streak, fetchStreak } = useGamificationStore();

  if (!streak) return null;

  const { current_streak, longest_streak, total_points, badge } = streak;

  const milestones = [
    { days: 7,  label: "7 dias",  reached: current_streak >= 7 },
    { days: 14, label: "14 dias", reached: current_streak >= 14 },
    { days: 30, label: "30 dias", reached: current_streak >= 30 },
  ];

  const nextMilestone = milestones.find((m) => !m.reached);
  const progressToNext = nextMilestone
    ? Math.min((current_streak / nextMilestone.days) * 100, 100)
    : 100;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame
            className={cn(
              "h-4 w-4",
              current_streak > 0 ? "text-orange-500" : "text-gray-300"
            )}
            aria-hidden
          />
          <span className="text-sm font-semibold text-gray-700">Sequência de atividade</span>
        </div>
        {badge && (
          <span
            className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700"
            aria-label={`Badge: ${badge.label}`}
          >
            {badge.icon} {badge.label}
          </span>
        )}
      </div>

      {/* Contador principal */}
      <div className="flex items-end gap-4">
        <div className="text-center">
          <p
            className={cn(
              "text-4xl font-bold tabular-nums",
              current_streak > 0 ? "text-orange-500" : "text-gray-300"
            )}
            aria-label={`${current_streak} dias consecutivos`}
          >
            {current_streak}
          </p>
          <p className="text-xs text-gray-400">dias</p>
        </div>
        <div className="flex-1 space-y-1.5 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Maior sequência</span>
            <span className="font-medium text-gray-700">{longest_streak} dias</span>
          </div>
          <div className="flex justify-between">
            <span>Pontos acumulados</span>
            <span className="flex items-center gap-1 font-medium text-yellow-600">
              <Star className="h-3 w-3" aria-hidden /> {total_points}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar para próximo milestone */}
      {nextMilestone && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>Próximo: {nextMilestone.label}</span>
            <span>{current_streak}/{nextMilestone.days}</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuenow={current_streak}
            aria-valuemax={nextMilestone.days}
            aria-label={`Progresso para ${nextMilestone.label}`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>
      )}

      {/* Milestones atingidos */}
      <div className="mt-3 flex gap-2">
        {milestones.map((m) => (
          <span
            key={m.days}
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              m.reached
                ? "bg-orange-100 text-orange-700"
                : "bg-gray-100 text-gray-400"
            )}
            aria-label={m.reached ? `${m.label} alcançados` : `${m.label} não alcançados`}
          >
            {m.reached ? "✓" : "○"} {m.label}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Revisão diária do portfólio · sem incentivo a overtrading
      </p>
    </div>
  );
}
