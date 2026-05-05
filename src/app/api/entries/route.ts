import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const createSchema = z.object({
  rawgId: z.number().int().optional(),
  title: z.string().min(1),
  cover: z.string().url().nullable().optional(),
  slug: z.string().nullable().optional(),
  released: z.string().nullable().optional(),
  platform: z.string().min(1),
  hours: z.number().min(0).default(0),
  rating: z.number().int().min(1).max(10).optional(),
  review: z.string().max(5000).optional(),
  status: z
    .enum(["PLAYING", "FINISHED", "DROPPED", "WISHLIST", "BACKLOG"])
    .default("PLAYING"),
});

export async function GET() {
  try {
    const { id } = await requireUser();
    const entries = await prisma.gameEntry.findMany({
      where: { userId: id },
      include: { game: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const game = await prisma.game.upsert({
    where: d.rawgId ? { rawgId: d.rawgId } : { id: "__none__" },
    update: { title: d.title, cover: d.cover ?? null, released: d.released ?? null },
    create: {
      rawgId: d.rawgId,
      slug: d.slug ?? null,
      title: d.title,
      cover: d.cover ?? null,
      released: d.released ?? null,
    },
  }).catch(async () =>
    prisma.game.create({
      data: {
        rawgId: d.rawgId,
        slug: d.slug ?? null,
        title: d.title,
        cover: d.cover ?? null,
        released: d.released ?? null,
      },
    }),
  );

  const entry = await prisma.gameEntry.create({
    data: {
      userId: user.id,
      gameId: game.id,
      platform: d.platform,
      hours: d.hours,
      rating: d.rating,
      review: d.review,
      status: d.status,
    },
    include: { game: true },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
