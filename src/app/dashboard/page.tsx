import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/supabase-server";
import { getProfile } from "@/lib/profile/queries";
import { GOAL_LABELS, EQUIPMENT_LABELS, SEX_LABELS } from "@/lib/profile/schema";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getProfile();
  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <Card>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted">
              Logado como <span className="font-medium text-foreground">{user?.email}</span>
            </p>
          </div>
          <Link href="/perfil">
            <Button variant="secondary">Editar perfil</Button>
          </Link>
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
        <p className="text-sm text-muted">
          Plano de treino e gráficos serão implementados nas próximas fases.
        </p>
      </Card>

      <form action={signOut}>
        <Button type="submit" variant="secondary">
          Sair
        </Button>
      </form>
    </main>
  );
}
