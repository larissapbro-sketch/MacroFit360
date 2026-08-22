import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/supabase-server";
import { getProfile } from "@/lib/profile/queries";
import { GOAL_LABELS, EQUIPMENT_LABELS, SEX_LABELS } from "@/lib/profile/schema";
import { getProgressHistory } from "@/lib/progress/queries";
import { getActiveMealPlan } from "@/lib/meal-plan/queries";
import { getWeeklyComparison } from "@/lib/dashboard/queries";
import { getSubscription, isPremiumActive } from "@/lib/subscription/queries";
import { getUnreadNotificationCount } from "@/lib/notifications/queries";
import { notifyProgressReminder } from "@/lib/notifications/triggers";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WeightChart } from "./weight-chart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getProfile();
  if (!profile) {
    redirect("/onboarding");
  }

  if (user) {
    // Sem cron ainda: lembrete de progresso é checado (e, se preciso,
    // criado) a cada visita ao dashboard — ver src/lib/notifications/triggers.ts.
    await notifyProgressReminder(supabase, user.id);
  }

  const [progressHistory, activeMealPlan, weeklyComparison, subscription, unreadCount] =
    await Promise.all([
      getProgressHistory(),
      getActiveMealPlan(),
      getWeeklyComparison(),
      getSubscription(),
      getUnreadNotificationCount(),
    ]);

  const premium = isPremiumActive(subscription);
  const latestWeight = [...progressHistory].reverse().find((e) => e.weight !== null)?.weight ?? profile.weight;
  const { currentWorkout, previousWorkout, currentMeal, previousMeal } = weeklyComparison;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="mb-1 text-xl font-semibold">Dashboard</h1>
            <p className="truncate text-sm text-muted">
              Logado como <span className="font-medium text-foreground">{user?.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/notificacoes" className="relative">
              <Button variant="secondary">
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/assinatura">
              <Button variant={premium ? "secondary" : "primary"}>
                {premium ? "Premium ✓" : "Assinar Premium"}
              </Button>
            </Link>
            <Link href="/perfil">
              <Button variant="secondary">Editar perfil</Button>
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t border-surface-border pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Peso</dt>
            <dd className="font-medium">{profile.weight} kg</dd>
          </div>
          <div>
            <dt className="text-muted">Altura</dt>
            <dd className="font-medium">{profile.height} cm</dd>
          </div>
          <div>
            <dt className="text-muted">Idade</dt>
            <dd className="font-medium">{profile.age} anos</dd>
          </div>
          <div>
            <dt className="text-muted">Sexo</dt>
            <dd className="font-medium">{SEX_LABELS[profile.sex]}</dd>
          </div>
          <div>
            <dt className="text-muted">Objetivo</dt>
            <dd className="font-medium">{GOAL_LABELS[profile.goal]}</dd>
          </div>
          <div>
            <dt className="text-muted">Dias de treino</dt>
            <dd className="font-medium">{profile.trainingDays}x/semana</dd>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <dt className="text-muted">Equipamentos</dt>
            <dd className="font-medium">
              {profile.equipment.map((eq) => EQUIPMENT_LABELS[eq]).join(", ")}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Orçamento semanal</dt>
            <dd className="font-medium">
              {profile.weeklyFoodBudget.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Resumo — spec seção 17 */}
      <Card>
        <h2 className="mb-3 font-semibold">Resumo</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Peso atual</dt>
            <dd className="text-lg font-semibold">{latestWeight} kg</dd>
          </div>
          <div>
            <dt className="text-muted">Meta calórica</dt>
            <dd className="text-lg font-semibold">
              {activeMealPlan ? `${activeMealPlan.dailyCalories} kcal` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Meta de proteína</dt>
            <dd className="text-lg font-semibold">
              {activeMealPlan ? `${activeMealPlan.proteinTarget} g` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Treinos concluídos</dt>
            <dd className="text-lg font-semibold">
              {currentWorkout ? `${currentWorkout.completedSessions}/${currentWorkout.totalSessions}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Consistência</dt>
            <dd className="text-lg font-semibold">
              {currentWorkout ? `${currentWorkout.adherencePercent}%` : "—"}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Gráfico de evolução do peso — spec seção 17/18 */}
      <Card>
        <h2 className="mb-3 font-semibold">Evolução do peso</h2>
        <WeightChart history={progressHistory} />
      </Card>

      {/* Comparativo semanal — recurso avançado, exclusivo Premium (spec seção 22) */}
      {(currentWorkout || currentMeal) && !premium && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Comparativo semanal</h2>
              <p className="text-sm text-muted">Recurso avançado disponível no Premium.</p>
            </div>
            <Link href="/assinatura">
              <Button variant="secondary">Assinar Premium</Button>
            </Link>
          </div>
        </Card>
      )}

      {(currentWorkout || currentMeal) && premium && (
        <Card>
          <h2 className="mb-3 font-semibold">Comparativo semanal</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-2 font-normal"></th>
                  <th className="pb-2 font-normal">
                    Semana anterior{previousWorkout ? ` (${previousWorkout.week})` : ""}
                  </th>
                  <th className="pb-2 font-normal">
                    Semana atual{currentWorkout ? ` (${currentWorkout.week})` : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                <tr>
                  <td className="py-2 text-muted">Adesão ao treino</td>
                  <td className="py-2">
                    {previousWorkout ? `${previousWorkout.adherencePercent}%` : "—"}
                  </td>
                  <td className="py-2 font-medium">
                    {currentWorkout ? `${currentWorkout.adherencePercent}%` : "—"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-muted">Treinos concluídos</td>
                  <td className="py-2">
                    {previousWorkout
                      ? `${previousWorkout.completedSessions}/${previousWorkout.totalSessions}`
                      : "—"}
                  </td>
                  <td className="py-2 font-medium">
                    {currentWorkout
                      ? `${currentWorkout.completedSessions}/${currentWorkout.totalSessions}`
                      : "—"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-muted">Meta calórica</td>
                  <td className="py-2">
                    {previousMeal ? `${previousMeal.dailyCalories} kcal` : "—"}
                  </td>
                  <td className="py-2 font-medium">
                    {currentMeal ? `${currentMeal.dailyCalories} kcal` : "—"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-muted">Meta de proteína</td>
                  <td className="py-2">{previousMeal ? `${previousMeal.proteinTarget} g` : "—"}</td>
                  <td className="py-2 font-medium">
                    {currentMeal ? `${currentMeal.proteinTarget} g` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Gere seu plano alimentar personalizado com base nas suas metas calculadas.
          </p>
          <Link href="/plano-alimentar">
            <Button variant="secondary">Plano alimentar</Button>
          </Link>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Gere seu plano de treino personalizado com base nos seus equipamentos e dias
            disponíveis.
          </p>
          <Link href="/plano-treino">
            <Button variant="secondary">Plano de treino</Button>
          </Link>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">Registre seu peso e medidas para acompanhar sua evolução.</p>
          <Link href="/progresso">
            <Button variant="secondary">Registrar progresso</Button>
          </Link>
        </div>
      </Card>

      <form action={signOut}>
        <Button type="submit" variant="secondary">
          Sair
        </Button>
      </form>
    </main>
  );
}
