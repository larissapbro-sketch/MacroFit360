import { createClient } from "@/lib/db/supabase-server";

export type SubscriptionStatus = "free" | "premium" | "pending" | "canceled" | "expired";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  expiresAt: string | null;
}

const FREE_SUBSCRIPTION: SubscriptionInfo = { status: "free", expiresAt: null };

/**
 * Estado da assinatura do usuário autenticado. Ausência de linha em
 * `subscriptions` é tratada como "free" (spec seção 23 — estados
 * possíveis: free, premium, pending, canceled, expired). Uma assinatura
 * marcada "premium" no banco mas com expires_at no passado é reclassificada
 * como "expired" aqui, sem depender de um job para atualizar o status.
 */
export async function getSubscription(): Promise<SubscriptionInfo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return FREE_SUBSCRIPTION;

  const { data } = await supabase
    .from("subscriptions")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return FREE_SUBSCRIPTION;

  if (data.status === "premium" && data.expires_at && new Date(data.expires_at) < new Date()) {
    return { status: "expired", expiresAt: data.expires_at };
  }

  return { status: data.status as SubscriptionStatus, expiresAt: data.expires_at };
}

export function isPremiumActive(subscription: SubscriptionInfo): boolean {
  return subscription.status === "premium";
}
