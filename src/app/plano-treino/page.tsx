import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile/queries";
import { getActiveWorkoutPlan } from "@/lib/workout-plan/queries";
import { Card } from "@/components/ui/card";
import { GenerateWorkoutPlanButton } from "./generate-workout-plan-button";
import { WorkoutSessionCheckbox } from "./workout-session-checkbox";

const DIFFICULTY_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export default async function PlanoTreinoPage() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/onboarding");
  }

  const plan = await getActiveWorkoutPlan();

  const sessionsByDay = plan
    ? Array.from({ length: plan.totalDays }, (_, i) => i + 1).map((day) => ({
        day,
        sessions: plan.sessions.filter((s) => s.day === day),
      }))
    : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold">Plano de treino</h1>
          <p className="text-sm text-muted">
            Gerado por IA com base nos seus equipamentos e dias disponíveis.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Voltar
        </Link>
      </div>

      {plan && (
        <Card>
          <p className="text-sm text-muted">
            Semana {plan.week} — nível {DIFFICULTY_LABELS[plan.difficulty] ?? plan.difficulty} —{" "}
            {plan.totalDays}x por semana
          </p>
          {plan.sessions.length > 0 && (
            <p className="mt-1 text-sm font-medium">
              {plan.sessions.filter((s) => s.completed).length} de {plan.sessions.length}{" "}
              exercícios concluídos
            </p>
          )}
        </Card>
      )}

      <GenerateWorkoutPlanButton hasPlan={!!plan} />

      {!plan && (
        <Card>
          <p className="text-sm text-muted">
            Você ainda não tem um plano de treino. Clique no botão acima para gerar o primeiro,
            com base nos seus dados de perfil.
          </p>
        </Card>
      )}

      {sessionsByDay.map(({ day, sessions }) => (
        <Card key={day}>
          <h2 className="mb-3 font-semibold">
            Dia {day}
            {sessions[0] ? ` — ${sessions[0].muscleGroup}` : ""}
          </h2>
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li key={s.id} className="border-t border-surface-border pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{s.exercise}</span>
                  <span className="text-sm text-muted">~{s.estimatedDuration} min</span>
                </div>
                <p className="text-sm text-muted">
                  {s.sets} séries x {s.reps} · descanso {s.restSeconds}s
                </p>
                <div className="mt-1">
                  <WorkoutSessionCheckbox sessionId={s.id} initialCompleted={s.completed} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </main>
  );
}
