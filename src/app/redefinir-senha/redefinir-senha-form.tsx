"use client";

import { useActionState } from "react";
import { updatePassword, type ActionResult } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";

const initialState: ActionResult = {};

export function RedefinirSenhaForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>

      <FormMessage message={state.error} />

      <Button type="submit" isLoading={isPending} className="w-full">
        Salvar nova senha
      </Button>
    </form>
  );
}
