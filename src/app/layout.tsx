import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Games Played",
  description: "Registra tus juegos, horas y reviews",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="es">
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">🎮 Games Played</Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/library" className="hover:underline">Mi biblioteca</Link>
              <Link href="/search" className="hover:underline">Buscar</Link>
              {session?.user ? (
                <>
                  <span className="text-neutral-400">{session.user.name ?? session.user.email}</span>
                  <Link href="/api/auth/signout" className="rounded bg-neutral-800 px-3 py-1">Salir</Link>
                </>
              ) : (
                <Link href="/api/auth/signin" className="rounded bg-emerald-600 px-3 py-1">Entrar</Link>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
