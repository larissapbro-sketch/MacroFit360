import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile/queries";
import { getActiveMealPlan } from "@/lib/meal-plan/queries";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/ai/meal-plan/schema";
import { Card } from "@/components/ui/card";
import { GenerateMealPlanButton } from "./generate-meal-plan-button";

export default async function PlanoAlimentarPage() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/onboarding");
  }

  const plan = await getActiveMealPlan();

  const mealsByType = MEAL_TYPES.map((type) => ({
    type,
    label: MEAL_TYPE_LABELS[type],
    items: plan?.meals.filter((m) => m.mealType === type) ?? [],
  })).filter((group) => group.items.length > 0);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold">Plano alimentar</h1>
          <p className="text-sm text-muted">
            Gerado por IA a partir das suas metas calculadas pelo sistema.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Voltar
        </Link>
      </div>

      {plan && (
        <Card>
          <p className="mb-1 text-sm text-muted">Semana {plan.week} — metas diárias</p>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted">Calorias</dt>
              <dd className="font-medium">{plan.dailyCalories} kcal</dd>
            </div>
            <div>
              <dt className="text-muted">Proteína</dt>
              <dd className="font-medium">{plan.proteinTarget} g</dd>
            </div>
            <div>
              <dt className="text-muted">Carboidratos</dt>
              <dd className="font-medium">{plan.carbTarget} g</dd>
            </div>
            <div>
              <dt className="text-muted">Gordura</dt>
              <dd className="font-medium">{plan.fatTarget} g</dd>
            </div>
          </dl>
        </Card>
      )}

      <GenerateMealPlanButton hasPlan={!!plan} />

      {!plan && (
        <Card>
          <p className="text-sm text-muted">
            Você ainda não tem um plano alimentar. Clique no botão acima para gerar o primeiro,
            com base nos seus dados de perfil.
          </p>
        </Card>
      )}

      {mealsByType.map((group) => (
        <Card key={group.type}>
          <h2 className="mb-3 font-semibold">{group.label}</h2>
          <ul className="space-y-3">
            {group.items.map((item) => (
              <li key={item.id} className="border-t border-surface-border pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{item.food}</span>
                  <span className="text-sm text-muted">{item.quantity}</span>
                </div>
                <p className="text-sm text-muted">
                  {item.calories} kcal · P {item.protein}g · C {item.carbs}g · G {item.fat}g
                </p>
                {item.alternatives.length > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    Alternativas: {item.alternatives.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </main>
  );
}
