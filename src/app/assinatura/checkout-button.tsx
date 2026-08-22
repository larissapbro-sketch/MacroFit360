"use client";

import { useActionState } from "react";
import { createCheckoutSessionAction, type CheckoutActionResult } from "@/lib/subscription/checkout-action";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

const initialState: CheckoutActionResult = {};

export function CheckoutButton() {
  const [state, formAction, isPending] = useActionState(createCheckoutSessionAction, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" isLoading={isPending} className="w-full">
        Assinar Premium — R$ 39,00/mês
      </Button>
      <FormMessage message={state.error} />
    </form>
  );
}
