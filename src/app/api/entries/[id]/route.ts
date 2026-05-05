import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const updateSchema = z.object({
  platform: z.string().min(1).optional(),
  hours: z.number().min(0).optional(),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  review: z.string().max(5000).nullable().optional(),
  status: z.enum(["PLAYING", "FINISHED", "DROPPED", "WISHLIST", "BACKLOG"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const existing = await prisma.gameEntry.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const entry = await prisma.gameEntry.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const existing = await prisma.gameEntry.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.gameEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
