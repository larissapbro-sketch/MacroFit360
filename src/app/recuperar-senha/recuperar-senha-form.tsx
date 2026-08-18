"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ActionResult } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";

const initialState: ActionResult = {};

export function RecuperarSenhaForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <FormMessage message={state.error} />

      <Button type="submit" isLoading={isPending} className="w-full">
        Enviar link de recuperação
      </Button>
    </form>
  );
}
