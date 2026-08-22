import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/subscription/stripe-client";
import { createAdminClient } from "@/lib/db/supabase-admin";

/**
 * Webhook do Stripe — única fonte de verdade para status de assinatura
 * (spec seção 24: "nunca confiar apenas na resposta do frontend para
 * considerar um pagamento aprovado"). Usa o client admin (service_role)
 * porque a requisição chega sem sessão de usuário Supabase nenhuma.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Assinatura do webhook inválida." }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (userId && subscriptionId) {
          await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              plan: "premium",
              status: "premium",
              subscription_id: subscriptionId,
              started_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (userId) {
          await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              plan: subscription.status === "active" ? "premium" : "free",
              status: mapStripeStatus(subscription.status),
              subscription_id: subscription.id,
              expires_at: getCurrentPeriodEndIso(subscription),
            },
            { onConflict: "user_id" }
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (userId) {
          await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              plan: "free",
              status: "canceled",
              subscription_id: subscription.id,
            },
            { onConflict: "user_id" }
          );
        }
        break;
      }

      default:
        // Outros eventos (invoice.*, payment_intent.*, etc.) não afetam
        // o status da assinatura por enquanto — ignorados de propósito.
        break;
    }
  } catch (err) {
    // Erro ao processar não deve nunca ser mascarado — Stripe reenvia o
    // evento se respondermos com erro, o que é o comportamento desejado.
    console.error("[stripe-webhook] erro ao processar evento", event.type, err);
    return NextResponse.json({ error: "Erro ao processar evento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "premium" | "pending" | "canceled" | "expired" {
  switch (status) {
    case "active":
    case "trialing":
      return "premium";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "pending";
    case "canceled":
      return "canceled";
    default:
      return "expired";
  }
}

function getCurrentPeriodEndIso(subscription: Stripe.Subscription): string | null {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
}
