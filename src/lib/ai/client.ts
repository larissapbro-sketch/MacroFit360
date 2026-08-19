import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/**
 * Client da API Anthropic — uso restrito ao servidor. ANTHROPIC_API_KEY
 * nunca é NEXT_PUBLIC_*, então nunca chega ao navegador.
 */
export function getAnthropicClient(): Anthropic {
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurada no servidor.");
  }

  client = new Anthropic({ apiKey });
  return client;
}

export const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
