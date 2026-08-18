import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RecuperarSenhaForm } from "./recuperar-senha-form";

export default function RecuperarSenhaPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Recuperar senha</h1>
        <p className="mb-6 text-sm text-muted">
          Informe seu e-mail para receber o link de redefinição de senha.
        </p>

        <RecuperarSenhaForm />

        <p className="mt-6 text-center text-sm text-muted">
          Lembrou a senha?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </main>
  );
}
