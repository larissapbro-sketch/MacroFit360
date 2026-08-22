"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/supabase-server";

export interface SetSessionCompletedResult {
  error?: string;
}

/**
 * Marca/desmarca um exercício como concluído. Alimenta o cálculo de
 * adesão ao treino (spec seção 16/17) — nenhum cálculo de progressão
 * acontece aqui, só o registro do fato.
 */
export async function setWorkoutSessionCompleted(
  sessionId: string,
  completed: boolean
): Promise<SetSessionCompletedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa estar logado." };
  }

  const { error } = await supabase
    .from("workout_sessions")
    .update({ completed })
    .eq("id", sessionId);

  if (error) {
    return { error: "Não foi possível atualizar. Tente novamente." };
  }

  revalidatePath("/plano-treino");
  revalidatePath("/dashboard");
  return {};
}
