import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile/queries";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile-form";

export default async function OnboardingPage() {
  // Quem já completou o onboarding não deve ver esta tela de novo —
  // ajustes de perfil acontecem em /perfil.
  const profile = await getProfile();
  if (profile) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-lg">
        <h1 className="mb-1 text-xl font-semibold">Vamos te conhecer</h1>
        <p className="mb-6 text-sm text-muted">
          Esses dados são a base para calcular suas metas e montar seus planos.
        </p>

        <ProfileForm submitLabel="Concluir onboarding" />
      </Card>
    </main>
  );
}
