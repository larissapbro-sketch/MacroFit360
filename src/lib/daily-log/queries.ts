import { createClient } from "@/lib/db/supabase-server";

export interface DailyLog {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const EMPTY_LOG: DailyLog = { calories: 0, protein: 0, carbs: 0, fat: 0 };

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Consumo real registrado hoje pelo usuário (diário alimentar). */
export async function getTodayLog(): Promise<DailyLog> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return EMPTY_LOG;

  const { data } = await supabase
    .from("daily_logs")
    .select("calories, protein, carbs, fat")
    .eq("user_id", user.id)
    .eq("log_date", todayIso())
    .maybeSingle();

  if (!data) return EMPTY_LOG;

  return {
    calories: Number(data.calories ?? 0),
    protein: Number(data.protein ?? 0),
    carbs: Number(data.carbs ?? 0),
    fat: Number(data.fat ?? 0),
  };
}
