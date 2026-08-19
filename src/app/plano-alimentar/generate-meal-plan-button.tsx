"use client";

import { useActionState } from "react";
import { generateMealPlanAction, type GenerateMealPlanActionResult } from "@/lib/meal-plan/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

const initialState: GenerateMealPlanActionResult = {};

export function GenerateMealPlanButton({ hasPlan }: { hasPlan: boolean }) {
  const [state, formAction, isPending] = useActionState(generateMealPlanAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <Button type="submit" isLoading={isPending} variant={hasPlan ? "secondary" : "primary"}>
        {isPending
          ? "Gerando com IA..."
          : hasPlan
            ? "Gerar novo plano alimentar"
            : "Gerar plano alimentar com IA"}
      </Button>
      <FormMessage message={state.error} />
    </form>
  );
}
