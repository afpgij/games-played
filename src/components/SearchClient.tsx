"use client";
import { useState } from "react";
import AddEntryDialog from "./AddEntryDialog";

type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  platforms?: { platform: { id: number; name: string } }[] | null;
};

export default function SearchClient() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<RawgGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<RawgGame | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/rawg/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hollow Knight, Elden Ring..."
          className="flex-1 rounded bg-neutral-900 px-3 py-2"
        />
        <button className="rounded bg-emerald-600 px-4 py-2" disabled={loading}>
          {loading ? "..." : "Buscar"}
        </button>
      </form>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((g) => (
          <li key={g.id} className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
            {g.background_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.background_image} alt={g.name} className="h-36 w-full object-cover" />
            )}
            <div className="space-y-1 p-3">
              <h3 className="font-semibold">{g.name}</h3>
              <p className="text-xs text-neutral-400">
                {g.released ?? "Sin fecha"} · ⭐ {g.rating?.toFixed(1) ?? "-"}
              </p>
              <p className="line-clamp-1 text-xs text-neutral-500">
                {g.platforms?.map((p) => p.platform.name).join(", ")}
              </p>
              <button
                onClick={() => setPicked(g)}
                className="mt-2 rounded bg-emerald-600 px-3 py-1 text-xs"
              >
                Añadir a biblioteca
              </button>
            </div>
          </li>
        ))}
      </ul>

      {picked && <AddEntryDialog game={picked} onClose={() => setPicked(null)} />}
    </div>
  );
}
