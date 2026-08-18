import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          MacroFit 360°
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Alimentação e treino personalizados por IA
        </h1>
        <p className="mx-auto max-w-md text-muted">
          Planos de dieta e treino que se adaptam ao seu peso, objetivo, rotina e orçamento —
          com progresso acompanhado semana a semana.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/cadastro">
          <Button>Criar minha conta</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">Já tenho conta</Button>
        </Link>
      </div>
    </main>
  );
}
