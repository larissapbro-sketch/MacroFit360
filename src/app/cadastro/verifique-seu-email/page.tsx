import { Card } from "@/components/ui/card";

export default function VerifiqueSeuEmailPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-xl font-semibold">Confirme seu e-mail</h1>
        <p className="text-sm text-muted">
          Enviamos um link de confirmação para o seu e-mail. Clique nele para ativar sua conta e
          fazer login.
        </p>
      </Card>
    </main>
  );
}
