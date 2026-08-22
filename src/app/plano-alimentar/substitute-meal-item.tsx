"use client";

import { useActionState, useState } from "react";
import {
  substituteMealItemAction,
  type SubstitutionActionResult,
  type SubstitutionContext,
} from "@/lib/meal-plan/substitution-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/ui/form-message";

const initialState: SubstitutionActionResult = {};

interface SubstituteMealItemProps {
  itemId: string;
  context: SubstitutionContext;
}

export function SubstituteMealItem({ itemId, context }: SubstituteMealItemProps) {
  const [open, setOpen] = useState(false);
  const [requestText, setRequestText] = useState("");
  const boundAction = substituteMealItemAction.bind(null, itemId, context);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 text-xs text-primary hover:underline"
      >
        Substituir
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 space-y-2 rounded-[var(--radius-sm)] bg-black/5 p-3">
      {context.alternatives?.length ? (
        <div className="flex flex-wrap gap-2">
          {context.alternatives.map((alt) => (
            <button
              key={alt}
              type="button"
              onClick={() => setRequestText(`Usar: ${alt}`)}
              className="rounded-full border border-surface-border px-2 py-1 text-xs hover:bg-primary hover:text-primary-foreground"
            >
              {alt}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Input
          name="request"
          placeholder='Ex.: "não quero frango hoje"'
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
          required
          className="text-sm"
        />
        <Button type="submit" isLoading={isPending} className="shrink-0">
          Trocar
        </Button>
      </div>

      <FormMessage message={state.error} />

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-muted hover:underline"
      >
        Cancelar
      </button>
    </form>
  );
}
