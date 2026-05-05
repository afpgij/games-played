import { NextResponse } from "next/server";
import { searchGames } from "@/lib/rawg";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  try {
    const results = await searchGames(q);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
