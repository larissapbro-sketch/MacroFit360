import { createClient } from "@/lib/db/supabase-server";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

/** Últimas notificações do usuário autenticado, mais recentes primeiro. */
export async function getNotifications(): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, message, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    status: n.status,
    createdAt: n.created_at,
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");

  return count ?? 0;
}
