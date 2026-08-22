"use client";

import { useState, useTransition } from "react";
import { logMealItemAction } from "@/lib/daily-log/actions";

export function LogMealItemButton({ itemId }: { itemId: string }) {
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        setError(null);
        startTransition(async () => {
          const result = await logMealItemAction(itemId);
          if (result.error) {
            setError(result.error);
          } else {
            setLogged(true);
          }
        });
      }}
      className="mt-1 ml-3 text-xs text-primary hover:underline disabled:opacity-60"
      title="Registrar que comi isso hoje"
    >
      {logged ? "✓ Registrado" : error ? "Tentar de novo" : "+ Comi isso hoje"}
    </button>
  );
}
