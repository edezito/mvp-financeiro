import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateFull(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export const TRANSACTION_CATEGORY_LABELS: Record<string, string> = {
  salary: "Salário",
  investment: "Investimento",
  freelance: "Freelance",
  food: "Alimentação",
  transport: "Transporte",
  housing: "Moradia",
  health: "Saúde",
  education: "Educação",
  entertainment: "Lazer",
  other: "Outros",
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  income: "Receita",
  expense: "Despesa",
};
