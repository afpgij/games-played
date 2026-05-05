"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PUBLIC_API_URL } from "@/lib/api";

export type Entry = {
  id: number;
  platform: string;
  hours: number;
  rating: number | null;
  review: string | null;
  status: string;
  game: { title: string; cover: string | null; released: string | null };
};

const STATUSES = ["PLAYING", "FINISHED", "DROPPED", "WISHLIST", "BACKLOG"] as const;

export default function EntryCard({ entry }: { entry: Entry }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState(entry.hours);
  const [rating, setRating] = useState<number | "">(entry.rating ?? "");
  const [review, setReview] = useState(entry.review ?? "");
  const [status, setStatus] = useState(entry.status);
  const [platform, setPlatform] = useState(entry.platform);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch(`${PUBLIC_API_URL}/entries/${entry.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hours: Number(hours),
        rating: rating === "" ? null : Number(rating),
        review,
        status,
        platform,
      }),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("¿Eliminar esta entrada?")) return;
    setBusy(true);
    await fetch(`${PUBLIC_API_URL}/entries/${entry.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <li className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
      {entry.game.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.game.cover} alt={entry.game.title} className="h-40 w-full object-cover" />
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{entry.game.title}</h3>
          <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs">{status}</span>
        </div>
        {!editing ? (
          <>
            <p className="text-sm text-neutral-400">
              {platform} · {hours} h{rating ? ` · ⭐ ${rating}/10` : ""}
            </p>
            {review && <p className="line-clamp-3 text-sm text-neutral-300">{review}</p>}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditing(true)} className="rounded bg-neutral-800 px-3 py-1 text-xs">Editar</button>
              <button onClick={remove} disabled={busy} className="rounded bg-red-900/60 px-3 py-1 text-xs">Eliminar</button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <input value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded bg-neutral-800 px-2 py-1 text-sm" />
            <div className="flex gap-2">
              <input type="number" min={0} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-1/2 rounded bg-neutral-800 px-2 py-1 text-sm" />
              <input type="number" min={1} max={10} value={rating} onChange={(e) => setRating(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Rating" className="w-1/2 rounded bg-neutral-800 px-2 py-1 text-sm" />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded bg-neutral-800 px-2 py-1 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={3} className="w-full rounded bg-neutral-800 px-2 py-1 text-sm" />
            <div className="flex gap-2">
              <button onClick={save} disabled={busy} className="rounded bg-emerald-600 px-3 py-1 text-xs">Guardar</button>
              <button onClick={() => setEditing(false)} className="rounded bg-neutral-800 px-3 py-1 text-xs">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
