"use client";

import { useState, useTransition } from "react";
import { setWorkoutSessionCompleted } from "@/lib/workout-plan/session-actions";
import { Checkbox } from "@/components/ui/checkbox";

export function WorkoutSessionCheckbox({
  sessionId,
  initialCompleted,
}: {
  sessionId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <Checkbox
        checked={completed}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          setCompleted(next);
          startTransition(async () => {
            const result = await setWorkoutSessionCompleted(sessionId, next);
            if (result?.error) {
              // Reverte o estado otimista se a gravação falhar.
              setCompleted(!next);
            }
          });
        }}
      />
      Concluído
    </label>
  );
}
