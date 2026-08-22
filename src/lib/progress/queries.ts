import { createClient } from "@/lib/db/supabase-server";
import type { MEASUREMENT_FIELDS } from "./schema";

export interface ProgressEntry {
  id: string;
  recordedAt: string;
  weight: number | null;
  measurements: Partial<Record<(typeof MEASUREMENT_FIELDS)[number], number>>;
  notes: string | null;
}

/**
 * Histórico de progresso do usuário autenticado, do mais antigo para o
 * mais recente (ordem que os gráficos esperam).
 */
export async function getProgressHistory(): Promise<ProgressEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("progress")
    .select("id, recorded_at, weight, measurements, notes")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    recordedAt: row.recorded_at,
    weight: row.weight === null ? null : Number(row.weight),
    measurements: row.measurements ?? {},
    notes: row.notes,
  }));
}
