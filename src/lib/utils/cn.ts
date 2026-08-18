/**
 * Combina classes condicionalmente, filtrando valores falsy.
 * Utilitário mínimo — evita depender de libs extras nesta fase.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
