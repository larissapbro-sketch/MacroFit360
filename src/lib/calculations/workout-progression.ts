export type Difficulty = "iniciante" | "intermediario" | "avancado";

const DIFFICULTY_ORDER: Difficulty[] = ["iniciante", "intermediario", "avancado"];

/**
 * Regras objetivas de progressão de treino (spec seção 16):
 * - < 60% de adesão na semana anterior: mantém ou reduz o nível.
 * - 60% a 79%: mantém o nível atual.
 * - 80% ou mais: aumenta levemente a dificuldade (1 nível).
 * - 90% ou mais sustentado por 2+ semanas seguidas: progressão adicional
 *   (2 níveis de uma vez, respeitando o teto "avançado").
 *
 * `previousAdherencePercent: null` significa que não há semana anterior
 * (primeiro plano do usuário) — sempre começa "iniciante".
 */
export function determineNextDifficulty(
  currentDifficulty: Difficulty,
  previousAdherencePercent: number | null,
  consecutiveHighAdherenceWeeks = 0
): Difficulty {
  if (previousAdherencePercent === null) return "iniciante";

  const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);

  if (previousAdherencePercent < 60) {
    return DIFFICULTY_ORDER[Math.max(currentIndex - 1, 0)];
  }

  if (previousAdherencePercent < 80) {
    return currentDifficulty;
  }

  const bump = previousAdherencePercent >= 90 && consecutiveHighAdherenceWeeks >= 2 ? 2 : 1;
  return DIFFICULTY_ORDER[Math.min(currentIndex + bump, DIFFICULTY_ORDER.length - 1)];
}
