import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile/queries";
import { getProgressHistory } from "@/lib/progress/queries";
import { MEASUREMENT_LABELS, MEASUREMENT_FIELDS } from "@/lib/progress/schema";
import { Card } from "@/components/ui/card";
import { ProgressForm } from "./progress-form";

export default async function ProgressoPage() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/onboarding");
  }

  const history = await getProgressHistory();
  const recentFirst = [...history].reverse();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold">Registrar progresso</h1>
          <p className="text-sm text-muted">
            Peso e medidas alimentam os gráficos do seu dashboard.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Voltar
        </Link>
      </div>

      <Card>
        <ProgressForm />
      </Card>

      {recentFirst.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold">Histórico</h2>
          <ul className="space-y-3">
            {recentFirst.map((entry) => (
              <li key={entry.id} className="border-t border-surface-border pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">
                    {new Date(entry.recordedAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                  </span>
                  {entry.weight !== null && (
                    <span className="text-sm text-muted">{entry.weight} kg</span>
                  )}
                </div>
                {MEASUREMENT_FIELDS.some((f) => entry.measurements[f] !== undefined) && (
                  <p className="text-xs text-muted">
                    {MEASUREMENT_FIELDS.filter((f) => entry.measurements[f] !== undefined)
                      .map((f) => `${MEASUREMENT_LABELS[f]}: ${entry.measurements[f]}cm`)
                      .join(" · ")}
                  </p>
                )}
                {entry.notes && <p className="mt-1 text-xs text-muted">{entry.notes}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
