import type { SupabaseClient } from "@supabase/supabase-js";

// Sem infraestrutura de agendamento (cron) ainda — as notificações da Fase 6
// nascem de EVENTOS reais (marcar treino como concluído) ou são calculadas
// preguiçosamente quando o usuário abre o dashboard, em vez de disparadas em
// horários configurados (spec seção 20, ainda não implementada). O dedup por
// título/dia evita repetir a mesma notificação a cada clique/carregamento.

type NotificationType = "lembrete" | "motivacional" | "progresso" | "nutricao";

async function alreadyNotifiedToday(
  supabase: SupabaseClient,
  userId: string,
  title: string
): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("title", title)
    .gte("created_at", startOfDay.toISOString());

  return (count ?? 0) > 0;
}

async function insertNotificationOnce(
  supabase: SupabaseClient,
  userId: string,
  type: NotificationType,
  title: string,
  message: string
): Promise<void> {
  if (await alreadyNotifiedToday(supabase, userId, title)) return;

  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    status: "pending",
  });
}

/**
 * Chamado sempre que um exercício é marcado como concluído. Gera no máximo
 * uma notificação motivacional simples por dia, mais uma de marco (80% ou
 * semana completa) quando a adesão da semana atual cruza esses limiares
 * (spec seção 19 — exemplos "Mais um treino concluído..." e "Parabéns!
 * Você completou uma semana de consistência.").
 */
export async function notifyWorkoutCompletion(
  supabase: SupabaseClient,
  userId: string,
  completedSessions: number,
  totalSessions: number
): Promise<void> {
  await insertNotificationOnce(
    supabase,
    userId,
    "motivacional",
    "Treino em dia",
    "Mais um treino concluído. Continue assim!"
  );

  if (totalSessions === 0) return;
  const percent = Math.round((completedSessions / totalSessions) * 100);

  if (percent === 100) {
    await insertNotificationOnce(
      supabase,
      userId,
      "progresso",
      "Semana completa!",
      "Parabéns! Você completou uma semana de consistência."
    );
  } else if (percent >= 80) {
    await insertNotificationOnce(
      supabase,
      userId,
      "progresso",
      "80% dos treinos concluídos",
      `Você completou ${percent}% dos seus treinos esta semana. Continue assim!`
    );
  }
}

/**
 * Lembrete de registro de progresso — checado a cada carregamento do
 * dashboard (spec seção 19, tipo "lembrete"). Dispara só se o último
 * registro tiver 7+ dias (ou nunca existiu), no máximo uma vez por dia.
 */
export async function notifyProgressReminder(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: lastEntry } = await supabase
    .from("progress")
    .select("recorded_at")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const daysSince = lastEntry
    ? Math.floor((Date.now() - new Date(lastEntry.recorded_at).getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  if (daysSince >= 7) {
    await insertNotificationOnce(
      supabase,
      userId,
      "lembrete",
      "Hora de registrar seu progresso",
      "Já faz uma semana desde seu último registro. Que tal atualizar seu peso e medidas hoje?"
    );
  }
}

/**
 * Marco de proteína do diário alimentar (spec seção 19, tipo "nutrição" —
 * ex.: "Você bateu 80% da sua meta de proteína hoje!"). Chamada sempre que
 * o usuário registra um item consumido; dispara no máximo uma vez por dia
 * assim que o total do dia cruza 80% da meta.
 */
export async function notifyNutritionMilestone(
  supabase: SupabaseClient,
  userId: string,
  proteinConsumed: number,
  proteinTarget: number
): Promise<void> {
  if (proteinTarget <= 0) return;
  const percent = Math.round((proteinConsumed / proteinTarget) * 100);

  if (percent >= 80) {
    await insertNotificationOnce(
      supabase,
      userId,
      "nutricao",
      "Meta de proteína quase lá",
      `Você bateu ${percent}% da sua meta de proteína hoje!`
    );
  }
}
