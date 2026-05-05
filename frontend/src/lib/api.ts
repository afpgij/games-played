import { cookies, headers } from "next/headers";

export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8002";

const INTERNAL_API_URL =
  process.env.API_URL_INTERNAL ?? PUBLIC_API_URL;

export type ApiOptions = RequestInit & { server?: boolean };

export async function apiFetch(path: string, opts: ApiOptions = {}) {
  const { server = false, headers: hdrs, ...rest } = opts;
  const base = server ? INTERNAL_API_URL : PUBLIC_API_URL;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...((hdrs as Record<string, string>) ?? {}),
  };
  if (server) {
    const cookieHeader = cookies()
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    if (cookieHeader) finalHeaders["cookie"] = cookieHeader;
    const fwd = headers().get("x-forwarded-for");
    if (fwd) finalHeaders["x-forwarded-for"] = fwd;
  }
  return fetch(`${base}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: server ? undefined : "include",
    cache: "no-store",
  });
}

export async function getMe() {
  const res = await apiFetch("/auth/me", { server: true });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: number; email: string; name: string | null; image: string | null }>;
}

export async function listEntries() {
  const res = await apiFetch("/entries", { server: true });
  if (!res.ok) return [];
  return res.json();
}
