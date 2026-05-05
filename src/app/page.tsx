import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Tu diario de juegos</h1>
      <p className="text-neutral-400">
        Registra horas, plataforma y una review breve de cada juego.
        Busca metadatos y reseñas vía RAWG para tu próxima partida.
      </p>
      <div className="flex gap-3">
        {session?.user ? (
          <>
            <Link href="/library" className="rounded bg-emerald-600 px-4 py-2">Ir a mi biblioteca</Link>
            <Link href="/search" className="rounded bg-neutral-800 px-4 py-2">Buscar juegos</Link>
          </>
        ) : (
          <Link href="/api/auth/signin" className="rounded bg-emerald-600 px-4 py-2">Entrar para empezar</Link>
        )}
      </div>
    </section>
  );
}
