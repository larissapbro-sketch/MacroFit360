import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase-server";

/**
 * Troca o "code" enviado por e-mail (confirmação de cadastro ou reset de senha)
 * por uma sessão válida, e então redireciona o usuário.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=link_invalido`);
}
