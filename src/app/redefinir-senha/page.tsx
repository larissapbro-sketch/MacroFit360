import { Card } from "@/components/ui/card";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

export default function RedefinirSenhaPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Definir nova senha</h1>
        <p className="mb-6 text-sm text-muted">
          Escolha uma nova senha para sua conta.
        </p>

        <RedefinirSenhaForm />
      </Card>
    </main>
  );
}
