import Link from "next/link";
import { createClient } from "@/lib/db/supabase-server";
import { getSubscription, isPremiumActive } from "@/lib/subscription/queries";
import { getUsageSummary } from "@/lib/subscription/limits";
import { Card } from "@/components/ui/card";
import { CheckoutButton } from "./checkout-button";

const PREMIUM_FEATURES = [
  "Treinos ilimitados",
  "Cardápios ilimitados",
  "Histórico completo de progresso",
  "Gráficos avançados",
  "Sugestões automáticas de suplementos",
  "Compras inteligentes",
  "Recursos avançados de personalização",
];

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subscription = await getSubscription();
  const premium = isPremiumActive(subscription);
  const usage = user && !premium ? await getUsageSummary(supabase, user.id) : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold">Assinatura</h1>
          <p className="text-sm text-muted">Gerencie seu plano no MacroFit 360°.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Voltar
        </Link>
      </div>

      {status === "sucesso" && (
        <Card className="border-success/40 bg-success/5">
          <p className="text-sm text-success">
            Pagamento iniciado! Seu acesso Premium é liberado assim que a confirmação chegar
            (normalmente em segundos).
          </p>
        </Card>
      )}
      {status === "cancelado" && (
        <Card>
          <p className="text-sm text-muted">Checkout cancelado. Nenhuma cobrança foi feita.</p>
        </Card>
      )}

      <Card>
        <p className="text-sm text-muted">Plano atual</p>
        <p className="text-lg font-semibold">
          {premium ? "Premium" : "Gratuito"}
          {subscription.status === "expired" && " (expirado)"}
          {subscription.status === "pending" && " (pagamento pendente)"}
          {subscription.status === "canceled" && " (cancelado)"}
        </p>

        {usage && (
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-surface-border pt-4 text-sm">
            <div>
              <dt className="text-muted">Cardápios gerados</dt>
              <dd className="font-medium">
                {usage.mealPlan.used}/{usage.mealPlan.limit}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Treinos gerados</dt>
              <dd className="font-medium">
                {usage.workoutPlan.used}/{usage.workoutPlan.limit}
              </dd>
            </div>
          </dl>
        )}
      </Card>

      {!premium && (
        <Card>
          <h2 className="mb-3 font-semibold">MacroFit 360° Premium</h2>
          <ul className="mb-4 space-y-1 text-sm text-muted">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>
          <CheckoutButton />
        </Card>
      )}
    </main>
  );
}
