import { Card } from "@/components/ui/card";

export default function RecuperarSenhaEnviadoPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-xl font-semibold">Verifique seu e-mail</h1>
        <p className="text-sm text-muted">
          Se houver uma conta com este e-mail, enviamos um link para redefinir sua senha.
        </p>
      </Card>
    </main>
  );
}
