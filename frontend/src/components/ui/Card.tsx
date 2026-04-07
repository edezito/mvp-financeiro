import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-brand-600",
  iconBg = "bg-brand-50",
  trend,
}: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-600",
              !trend && "text-gray-900"
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
    </Card>
  );
}
