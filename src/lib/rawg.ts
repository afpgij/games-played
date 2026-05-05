const RAWG_BASE = "https://api.rawg.io/api";

export type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  platforms?: { platform: { id: number; name: string } }[] | null;
  description_raw?: string;
};

export async function searchGames(query: string, page = 1): Promise<RawgGame[]> {
  const key = process.env.RAWG_API_KEY;
  if (!key) throw new Error("RAWG_API_KEY missing");
  const url = `${RAWG_BASE}/games?key=${key}&search=${encodeURIComponent(query)}&page_size=20&page=${page}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`RAWG search failed: ${res.status}`);
  const data = await res.json();
  return data.results as RawgGame[];
}

export async function getGame(idOrSlug: string | number): Promise<RawgGame> {
  const key = process.env.RAWG_API_KEY;
  if (!key) throw new Error("RAWG_API_KEY missing");
  const res = await fetch(`${RAWG_BASE}/games/${idOrSlug}?key=${key}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`RAWG get failed: ${res.status}`);
  return res.json();
}
