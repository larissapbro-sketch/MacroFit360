"use client";

import { useActionState, useRef, useEffect } from "react";
import { logProgressAction, type LogProgressActionResult } from "@/lib/progress/actions";
import { MEASUREMENT_FIELDS, MEASUREMENT_LABELS } from "@/lib/progress/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";

const initialState: LogProgressActionResult = {};

export function ProgressForm() {
  const [state, formAction, isPending] = useActionState(logProgressAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="weight">Peso (kg)</Label>
        <Input id="weight" name="weight" type="number" step="0.1" min="1" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {MEASUREMENT_FIELDS.map((field) => (
          <div key={field}>
            <Label htmlFor={field}>{MEASUREMENT_LABELS[field]} (cm)</Label>
            <Input id={field} name={field} type="number" step="0.1" min="1" />
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          className="w-full rounded-[var(--radius-sm)] border border-surface-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary"
          placeholder="Como você está se sentindo, sono, energia..."
        />
      </div>

      <FormMessage message={state.error} />
      {state.success && <FormMessage type="success" message="Registro salvo com sucesso." />}

      <Button type="submit" isLoading={isPending} className="w-full">
        Registrar progresso
      </Button>
    </form>
  );
}
