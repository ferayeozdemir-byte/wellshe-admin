"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // 🔴 KRİTİK KISIM BURASI
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("access_token=")) {
      window.location.href =
        "/auth/callback?next=/update-password" + window.location.hash;
    }
  }, []);
  // 🔴 KRİTİK KISIM BİTTİ

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return setMsg(error.message);

    router.replace("/dashboard");
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Admin Giriş</h1>

      <form onSubmit={onLogin}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid #ccc",
            marginTop: 12,
          }}
        />

        <input
          placeholder="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid #ccc",
            marginTop: 12,
          }}
        />

        <button style={{ marginTop: 16 }}>Giriş yap</button>

        {msg && <p style={{ color: "crimson" }}>{msg}</p>}
      </form>
    </main>
  );
}
