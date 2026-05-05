import Link from "next/link";
import { getMe, PUBLIC_API_URL } from "@/lib/api";

export default async function Home() {
  const me = await getMe();
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Tu diario de juegos</h1>
      <p className="text-neutral-400">
        Registra horas, plataforma y una review breve de cada juego.
        Busca metadatos y reseñas vía RAWG.
      </p>
      <div className="flex gap-3">
        {me ? (
          <>
            <Link href="/library" className="rounded bg-emerald-600 px-4 py-2">Mi biblioteca</Link>
            <Link href="/search" className="rounded bg-neutral-800 px-4 py-2">Buscar juegos</Link>
          </>
        ) : (
          <>
            <a href={`${PUBLIC_API_URL}/auth/login/google`} className="rounded bg-emerald-600 px-4 py-2">
              Entrar con Google
            </a>
            <a href={`${PUBLIC_API_URL}/auth/login/discord`} className="rounded bg-indigo-600 px-4 py-2">
              Entrar con Discord
            </a>
          </>
        )}
      </div>
    </section>
  );
}
