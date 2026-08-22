"use client";

import { useTransition } from "react";
import { resetTodayLogAction } from "@/lib/daily-log/actions";
import { Button } from "@/components/ui/button";
import type { DailyLog } from "@/lib/daily-log/queries";

interface DailyLogSummaryProps {
  log: DailyLog;
  targets: { dailyCalories: number; proteinTarget: number; carbTarget: number; fatTarget: number };
}

export function DailyLogSummary({ log, targets }: DailyLogSummaryProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-muted">Consumido hoje (registrado por você)</p>
        <Button
          type="button"
          variant="ghost"
          isLoading={isPending}
          onClick={() =>
            startTransition(async () => {
              await resetTodayLogAction();
            })
          }
        >
          Zerar hoje
        </Button>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted">Calorias</dt>
          <dd className="font-medium">
            {log.calories} / {targets.dailyCalories} kcal
          </dd>
        </div>
        <div>
          <dt className="text-muted">Proteína</dt>
          <dd className="font-medium">
            {log.protein} / {targets.proteinTarget} g
          </dd>
        </div>
        <div>
          <dt className="text-muted">Carboidratos</dt>
          <dd className="font-medium">
            {log.carbs} / {targets.carbTarget} g
          </dd>
        </div>
        <div>
          <dt className="text-muted">Gordura</dt>
          <dd className="font-medium">
            {log.fat} / {targets.fatTarget} g
          </dd>
        </div>
      </dl>
    </div>
  );
}
