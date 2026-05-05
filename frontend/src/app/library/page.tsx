import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe, listEntries } from "@/lib/api";
import EntryCard, { type Entry } from "@/components/EntryCard";

export default async function LibraryPage() {
  const me = await getMe();
  if (!me) redirect("/");
  const entries: Entry[] = await listEntries();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mi biblioteca</h1>
        <Link href="/search" className="rounded bg-emerald-600 px-3 py-1 text-sm">+ Añadir juego</Link>
      </div>
      {entries.length === 0 ? (
        <p className="text-neutral-400">
          Aún no tienes juegos. <Link href="/search" className="underline">Busca uno</Link>.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((e) => <EntryCard key={e.id} entry={e} />)}
        </ul>
      )}
    </section>
  );
}
