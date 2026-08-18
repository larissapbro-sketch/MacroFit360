import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CadastroForm } from "./cadastro-form";

export default function CadastroPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Criar conta</h1>
        <p className="mb-6 text-sm text-muted">
          Comece sua jornada no MacroFit 360°.
        </p>

        <CadastroForm />

        <p className="mt-6 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </main>
  );
}
