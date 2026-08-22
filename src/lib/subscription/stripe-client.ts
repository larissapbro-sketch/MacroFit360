import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Client do Stripe — uso restrito ao servidor. STRIPE_SECRET_KEY nunca é
 * NEXT_PUBLIC_*, então nunca chega ao navegador.
 */
export function getStripeClient(): Stripe {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY não configurada no servidor.");
  }

  client = new Stripe(secretKey);
  return client;
}
