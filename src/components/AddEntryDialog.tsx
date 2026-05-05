"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  platforms?: { platform: { id: number; name: string } }[] | null;
};

export default function AddEntryDialog({
  game,
  onClose,
}: {
  game: RawgGame;
  onClose: () => void;
}) {
  const router = useRouter();
  const platforms = game.platforms?.map((p) => p.platform.name) ?? [];
  const [platform, setPlatform] = useState(platforms[0] ?? "PC");
  const [hours, setHours] = useState(0);
  const [rating, setRating] = useState<number | "">("");
  const [review, setReview] = useState("");
  const [status, setStatus] = useState("PLAYING");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawgId: game.id,
        slug: game.slug,
        title: game.name,
        cover: game.background_image,
        released: game.released,
        platform,
        hours: Number(hours),
        rating: rating === "" ? undefined : Number(rating),
        review: review || undefined,
        status,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.status === 401 ? "Debes iniciar sesión" : "Error al guardar");
      return;
    }
    onClose();
    router.push("/library");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4"
      >
        <h2 className="text-lg font-semibold">{game.name}</h2>
        {platforms.length > 0 ? (
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded bg-neutral-900 px-2 py-2"
          >
            {platforms.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        ) : (
          <input
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded bg-neutral-900 px-2 py-2"
            placeholder="Plataforma"
          />
        )}
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            placeholder="Horas"
            className="w-1/2 rounded bg-neutral-900 px-2 py-2"
          />
          <input
            type="number"
            min={1}
            max={10}
            value={rating}
            onChange={(e) => setRating(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Rating 1-10"
            className="w-1/2 rounded bg-neutral-900 px-2 py-2"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded bg-neutral-900 px-2 py-2"
        >
          <option value="PLAYING">Jugando</option>
          <option value="FINISHED">Terminado</option>
          <option value="DROPPED">Abandonado</option>
          <option value="WISHLIST">Wishlist</option>
          <option value="BACKLOG">Backlog</option>
        </select>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Review (opcional)"
          rows={4}
          className="w-full rounded bg-neutral-900 px-2 py-2"
        />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded bg-neutral-800 px-3 py-1 text-sm">
            Cancelar
          </button>
          <button disabled={busy} className="rounded bg-emerald-600 px-3 py-1 text-sm">
            {busy ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
