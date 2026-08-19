"use client";

import { useActionState } from "react";
import {
  generateWorkoutPlanAction,
  type GenerateWorkoutPlanActionResult,
} from "@/lib/workout-plan/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

const initialState: GenerateWorkoutPlanActionResult = {};

export function GenerateWorkoutPlanButton({ hasPlan }: { hasPlan: boolean }) {
  const [state, formAction, isPending] = useActionState(generateWorkoutPlanAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <Button type="submit" isLoading={isPending} variant={hasPlan ? "secondary" : "primary"}>
        {isPending
          ? "Gerando com IA..."
          : hasPlan
            ? "Gerar novo plano de treino"
            : "Gerar plano de treino com IA"}
      </Button>
      <FormMessage message={state.error} />
    </form>
  );
}
