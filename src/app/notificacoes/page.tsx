import Link from "next/link";
import { createClient } from "@/lib/db/supabase-server";
import { getNotifications } from "@/lib/notifications/queries";
import { Card } from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  lembrete: "Lembrete",
  motivacional: "Motivacional",
  progresso: "Progresso",
  nutricao: "Nutrição",
};

export default async function NotificacoesPage() {
  const notifications = await getNotifications();

  // Abrir a tela já marca como lidas — não precisa de ação extra do usuário.
  // Update direto (sem passar pela server action) porque revalidatePath não
  // pode ser chamado durante a renderização de uma página, só a partir de
  // Server Actions/Route Handlers.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("notifications")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "pending");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold">Notificações</h1>
          <p className="text-sm text-muted">Lembretes, marcos e mensagens motivacionais.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Voltar
        </Link>
      </div>

      {notifications.length === 0 && (
        <Card>
          <p className="text-sm text-muted">
            Nenhuma notificação ainda. Elas aparecem conforme você usa o app — ao concluir
            treinos, bater marcos de consistência, ou quando fizer tempo desde seu último
            registro de progresso.
          </p>
        </Card>
      )}

      {notifications.map((n) => (
        <Card key={n.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {TYPE_LABELS[n.type] ?? n.type}
              </p>
              <h2 className="font-semibold">{n.title}</h2>
              <p className="text-sm text-muted">{n.message}</p>
            </div>
            <span className="shrink-0 text-xs text-muted">
              {new Date(n.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </Card>
      ))}
    </main>
  );
}
