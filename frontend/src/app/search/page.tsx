import { redirect } from "next/navigation";
import { getMe } from "@/lib/api";
import SearchClient from "@/components/SearchClient";

export default async function SearchPage() {
  const me = await getMe();
  if (!me) redirect("/");
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Buscar juegos</h1>
      <p className="text-sm text-neutral-400">
        Datos y reseñas vía RAWG. Añade un juego a tu biblioteca con tus horas, plataforma y review.
      </p>
      <SearchClient />
    </section>
  );
}
