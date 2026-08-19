import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile/queries";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile-form";

export default async function PerfilPage() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-xl font-semibold">Editar perfil</h1>
            <p className="text-sm text-muted">Atualize seus dados a qualquer momento.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            Voltar
          </Link>
        </div>

        <ProfileForm defaultValues={profile} submitLabel="Salvar alterações" />
      </Card>
    </main>
  );
}
