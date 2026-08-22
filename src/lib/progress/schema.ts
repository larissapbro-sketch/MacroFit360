import { z } from "zod";

// FormData sempre entrega string (mesmo vazia, para inputs em branco).
// Sem isso, z.coerce.number().optional() trata "" como 0 e falha o
// .positive() em campos que o usuário deixou vazio de propósito.
const optionalPositiveNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce.number().positive().max(400).optional()
);

// Campos de medidas corporais comuns — todos opcionais, em cm.
export const MEASUREMENT_FIELDS = [
  "waist",
  "hip",
  "chest",
  "arm",
  "thigh",
] as const;

export const MEASUREMENT_LABELS: Record<(typeof MEASUREMENT_FIELDS)[number], string> = {
  waist: "Cintura",
  hip: "Quadril",
  chest: "Peito",
  arm: "Braço",
  thigh: "Coxa",
};

export const progressEntrySchema = z
  .object({
    weight: optionalPositiveNumber,
    waist: optionalPositiveNumber,
    hip: optionalPositiveNumber,
    chest: optionalPositiveNumber,
    arm: optionalPositiveNumber,
    thigh: optionalPositiveNumber,
    notes: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().max(500).optional()
    ),
  })
  .refine(
    (data) =>
      data.weight !== undefined ||
      MEASUREMENT_FIELDS.some((field) => data[field] !== undefined),
    { message: "Informe ao menos o peso ou uma medida." }
  );

export type ProgressEntryInput = z.infer<typeof progressEntrySchema>;
