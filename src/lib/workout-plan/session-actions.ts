"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/supabase-server";
import { notifyWorkoutCompletion } from "@/lib/notifications/triggers";

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

  const { data: updatedSession, error } = await supabase
    .from("workout_sessions")
    .update({ completed })
    .eq("id", sessionId)
    .select("workout_plan_id")
    .single();

  if (error || !updatedSession) {
    return { error: "Não foi possível atualizar. Tente novamente." };
  }

  if (completed) {
    const { data: allSessions } = await supabase
      .from("workout_sessions")
      .select("completed")
      .eq("workout_plan_id", updatedSession.workout_plan_id);

    const total = allSessions?.length ?? 0;
    const done = allSessions?.filter((s) => s.completed).length ?? 0;
    await notifyWorkoutCompletion(supabase, user.id, done, total);
  }

  revalidatePath("/plano-treino");
  revalidatePath("/dashboard");
  revalidatePath("/notificacoes");
  return {};
}
