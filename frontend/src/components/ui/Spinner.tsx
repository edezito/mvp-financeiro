import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("h-5 w-5 animate-spin text-brand-600", className)} />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    </div>
  );
}

export function SectionSpinner() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Spinner />
    </div>
  );
}
