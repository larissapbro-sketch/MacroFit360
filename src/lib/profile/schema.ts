import { z } from "zod";

// Valores persistidos em profiles.goal — mantidos em português/snake_case
// para bater com o CHECK constraint da tabela (supabase/migrations/0001_init_schema.sql).
export const GOALS = ["hipertrofia", "definicao", "perda_de_gordura"] as const;
export const SEXES = ["masculino", "feminino"] as const;
export const EQUIPMENT_OPTIONS = ["academia", "casa", "elasticos", "peso_corporal"] as const;

export type Goal = (typeof GOALS)[number];
export type Sex = (typeof SEXES)[number];
export type Equipment = (typeof EQUIPMENT_OPTIONS)[number];

export const GOAL_LABELS: Record<Goal, string> = {
  hipertrofia: "Hipertrofia",
  definicao: "Definição",
  perda_de_gordura: "Perda de gordura",
};

export const SEX_LABELS: Record<Sex, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  academia: "Academia",
  casa: "Casa",
  elasticos: "Elásticos",
  peso_corporal: "Peso corporal",
};

export const profileSchema = z.object({
  weight: z.coerce
    .number({ message: "Informe o peso em kg." })
    .positive("Peso deve ser maior que zero.")
    .max(400, "Peso muito alto — confira o valor."),
  height: z.coerce
    .number({ message: "Informe a altura em cm." })
    .positive("Altura deve ser maior que zero.")
    .max(300, "Altura muito alta — confira o valor."),
  age: z.coerce
    .number({ message: "Informe a idade." })
    .int("Idade deve ser um número inteiro.")
    .min(1, "Idade inválida.")
    .max(119, "Idade inválida."),
  sex: z.enum(SEXES, { message: "Selecione o sexo." }),
  goal: z.enum(GOALS, { message: "Selecione um objetivo." }),
  trainingDays: z.coerce
    .number({ message: "Informe os dias disponíveis para treino." })
    .int("Deve ser um número inteiro.")
    .min(0, "Mínimo de 0 dias.")
    .max(7, "Máximo de 7 dias."),
  equipment: z
    .array(z.enum(EQUIPMENT_OPTIONS))
    .min(1, "Selecione ao menos um equipamento disponível."),
  weeklyFoodBudget: z.coerce
    .number({ message: "Informe o orçamento semanal para alimentação." })
    .min(0, "O orçamento não pode ser negativo."),
});

export type ProfileInput = z.infer<typeof profileSchema>;
