import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { getMe, PUBLIC_API_URL } from "@/lib/api";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Games Played",
  description: "Registra tus juegos, horas y reviews",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  return (
    <html lang="es">
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">🎮 Games Played</Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/library" className="hover:underline">Mi biblioteca</Link>
              <Link href="/search" className="hover:underline">Buscar</Link>
              {me ? (
                <>
                  <span className="text-neutral-400">{me.name ?? me.email}</span>
                  <LogoutButton />
                </>
              ) : (
                <div className="flex gap-2">
                  <a href={`${PUBLIC_API_URL}/auth/login/google`} className="rounded bg-emerald-600 px-3 py-1">
                    Google
                  </a>
                  <a href={`${PUBLIC_API_URL}/auth/login/discord`} className="rounded bg-indigo-600 px-3 py-1">
                    Discord
                  </a>
                </div>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
