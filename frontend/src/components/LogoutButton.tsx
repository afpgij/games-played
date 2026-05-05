"use client";
import { PUBLIC_API_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch(`${PUBLIC_API_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
        router.refresh();
      }}
      className="rounded bg-neutral-800 px-3 py-1"
    >
      Salir
    </button>
  );
}
