"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileActionResult } from "@/lib/profile/actions";
import {
  EQUIPMENT_LABELS,
  EQUIPMENT_OPTIONS,
  GOAL_LABELS,
  GOALS,
  SEX_LABELS,
  SEXES,
} from "@/lib/profile/schema";
import type { Profile } from "@/lib/profile/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormMessage } from "@/components/ui/form-message";

const initialState: ProfileActionResult = {};

interface ProfileFormProps {
  defaultValues?: Profile | null;
  submitLabel: string;
}

export function ProfileForm({ defaultValues, submitLabel }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(saveProfile, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            step="0.1"
            min="1"
            defaultValue={defaultValues?.weight}
            required
          />
        </div>
        <div>
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            name="height"
            type="number"
            step="0.1"
            min="1"
            defaultValue={defaultValues?.height}
            required
          />
        </div>
        <div>
          <Label htmlFor="age">Idade</Label>
          <Input
            id="age"
            name="age"
            type="number"
            min="1"
            max="119"
            defaultValue={defaultValues?.age}
            required
          />
        </div>
        <div>
          <Label htmlFor="trainingDays">Dias de treino/semana</Label>
          <Input
            id="trainingDays"
            name="trainingDays"
            type="number"
            min="0"
            max="7"
            defaultValue={defaultValues?.trainingDays}
            required
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-foreground">Sexo</legend>
        <div className="flex gap-4">
          {SEXES.map((sex) => (
            <label key={sex} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="sex"
                value={sex}
                defaultChecked={defaultValues?.sex === sex}
                required
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              {SEX_LABELS[sex]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-foreground">Objetivo</legend>
        <div className="flex flex-wrap gap-4">
          {GOALS.map((goal) => (
            <label key={goal} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="goal"
                value={goal}
                defaultChecked={defaultValues?.goal === goal}
                required
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              {GOAL_LABELS[goal]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-foreground">
          Equipamentos disponíveis
        </legend>
        <div className="flex flex-wrap gap-4">
          {EQUIPMENT_OPTIONS.map((equipment) => (
            <label key={equipment} className="flex items-center gap-2 text-sm">
              <Checkbox
                name="equipment"
                value={equipment}
                defaultChecked={defaultValues?.equipment.includes(equipment)}
              />
              {EQUIPMENT_LABELS[equipment]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="weeklyFoodBudget">Orçamento semanal para alimentação (R$)</Label>
        <Input
          id="weeklyFoodBudget"
          name="weeklyFoodBudget"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.weeklyFoodBudget}
          required
        />
      </div>

      <FormMessage message={state.error} />

      <Button type="submit" isLoading={isPending} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
