"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { getStripeClient } from "./stripe-client";

export interface CheckoutActionResult {
  error?: string;
}

const PREMIUM_PRICE_CENTS = 3900; // R$ 39,00 — spec seção 22

/**
 * Cria uma sessão de Checkout do Stripe para a assinatura Premium e
 * redireciona o usuário para lá. O status da assinatura só é atualizado
 * de fato quando o webhook confirma o pagamento (nunca aqui) — spec
 * seção 24: "nunca confiar apenas na resposta do frontend".
 */
// useActionState sempre chama a action com (state, formData); como este
// fluxo não depende de nenhum campo de formulário, os parâmetros são
// omitidos aqui (JS ignora argumentos extras passados em runtime).
export async function createCheckoutSessionAction(): Promise<CheckoutActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Você precisa estar logado." };
  }

  let checkoutUrl: string;
  try {
    const stripe = getStripeClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: "MacroFit 360° Premium" },
            unit_amount: PREMIUM_PRICE_CENTS,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: { userId: user.id },
      },
      success_url: `${siteUrl}/assinatura?status=sucesso`,
      cancel_url: `${siteUrl}/assinatura?status=cancelado`,
    });

    if (!session.url) {
      throw new Error("Sessão de checkout sem URL de redirecionamento.");
    }
    checkoutUrl = session.url;
  } catch {
    return { error: "Não foi possível iniciar o checkout agora. Tente novamente em instantes." };
  }

  redirect(checkoutUrl);
}
