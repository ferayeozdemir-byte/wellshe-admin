"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Sayfa açılınca session var mı kontrol et
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setMsg("Oturum bulunamadı. Lütfen 'reset password' linkinden yeniden gelin.");
      }
    })();
  }, []);

  async function save() {
    setMsg(null);

    if (!pw || pw.length < 6) return setMsg("Şifre en az 6 karakter olmalı.");
    if (pw !== pw2) return setMsg("Şifreler eşleşmiyor.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);

    if (error) return setMsg(error.message);

    router.replace("/login");
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1>Yeni Şifre</h1>

      <input
        type="password"
        placeholder="Yeni şifre"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        style={{ width: "100%", padding: 10, border: "1px solid #ccc", marginTop: 12 }}
      />

      <input
        type="password"
        placeholder="Yeni şifre (tekrar)"
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
        style={{ width: "100%", padding: 10, border: "1px solid #ccc", marginTop: 12 }}
      />

      <button
        onClick={save}
        disabled={loading}
        style={{ width: "100%", padding: 10, marginTop: 12 }}
      >
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </button>

      {msg && <p style={{ marginTop: 12, color: "crimson" }}>{msg}</p>}
    </div>
  );
}
