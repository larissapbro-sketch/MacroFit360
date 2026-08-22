"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/supabase-server";
import { MEASUREMENT_FIELDS, progressEntrySchema } from "./schema";

export interface LogProgressActionResult {
  error?: string;
  success?: boolean;
}

export async function logProgressAction(
  _prevState: LogProgressActionResult,
  formData: FormData
): Promise<LogProgressActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa estar logado." };
  }

  const parsed = progressEntrySchema.safeParse({
    weight: formData.get("weight"),
    waist: formData.get("waist"),
    hip: formData.get("hip"),
    chest: formData.get("chest"),
    arm: formData.get("arm"),
    thigh: formData.get("thigh"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { weight, notes, ...measurementValues } = parsed.data;

  const measurements = Object.fromEntries(
    MEASUREMENT_FIELDS.map((field) => [field, measurementValues[field]]).filter(
      ([, value]) => value !== undefined
    )
  );

  const { error } = await supabase.from("progress").insert({
    user_id: user.id,
    weight: weight ?? null,
    measurements,
    notes: notes ?? null,
  });

  if (error) {
    return { error: "Não foi possível salvar seu registro. Tente novamente." };
  }

  revalidatePath("/progresso");
  revalidatePath("/dashboard");
  return { success: true };
}
