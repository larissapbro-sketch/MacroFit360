import { createClient } from "@/lib/db/supabase-server";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <Card>
        <h1 className="mb-1 text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">
          Logado como <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <p className="mt-4 text-sm text-muted">
          Onboarding, planos e gráficos serão implementados nas próximas fases.
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
