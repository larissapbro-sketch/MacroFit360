import { createClient } from "@/lib/db/supabase-server";

export interface WorkoutSession {
  id: string;
  day: number;
  muscleGroup: string;
  exercise: string;
  sets: number;
  reps: string;
  restSeconds: number;
  estimatedDuration: number;
  completed: boolean;
}

export interface WorkoutPlanWithSessions {
  id: string;
  week: number;
  difficulty: string;
  totalDays: number;
  sessions: WorkoutSession[];
}

/**
 * Retorna o plano de treino ativo do usuário autenticado, com as sessões
 * já carregadas. Null se ele nunca gerou um plano.
 */
export async function getActiveWorkoutPlan(): Promise<WorkoutPlanWithSessions | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: plan } = await supabase
    .from("workout_plans")
    .select("id, week, difficulty, total_days")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!plan) return null;

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, day, muscle_group, exercise, sets, reps, rest_seconds, estimated_duration, completed")
    .eq("workout_plan_id", plan.id)
    .order("day", { ascending: true });

  return {
    id: plan.id,
    week: plan.week,
    difficulty: plan.difficulty,
    totalDays: plan.total_days,
    sessions: (sessions ?? []).map((s) => ({
      id: s.id,
      day: s.day,
      muscleGroup: s.muscle_group,
      exercise: s.exercise,
      sets: s.sets,
      reps: s.reps,
      restSeconds: s.rest_seconds,
      estimatedDuration: s.estimated_duration,
      completed: s.completed,
    })),
  };
}
