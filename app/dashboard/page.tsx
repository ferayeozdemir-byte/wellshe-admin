"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <Link href="/dashboard/articles">Articles</Link>
        <Link href="/dashboard/assets">Assets</Link>
        <Link href="/dashboard/categories">Categories</Link>
      </div>

      <button onClick={logout} style={{ marginTop: 24 }}>
        Çıkış yap
      </button>
    </div>
  );
}