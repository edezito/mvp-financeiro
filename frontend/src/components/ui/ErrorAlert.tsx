"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

export function ErrorAlert({ message, onClose, className }: ErrorAlertProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4",
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
      <p className="flex-1 text-sm text-red-700">{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-600">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
