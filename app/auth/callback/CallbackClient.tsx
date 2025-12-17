"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackClient() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    (async () => {
      const supabase = createClient();

      // 1) ?code=...
      const code = params.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // 2) #access_token=...&refresh_token=...
      const hash = window.location.hash?.slice(1) || "";
      const hp = new URLSearchParams(hash);
      const access_token = hp.get("access_token");
      const refresh_token = hp.get("refresh_token");

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }

      const next = params.get("next") ?? "/dashboard";
      router.replace(next);
    })();
  }, [router, params]);

  return <p style={{ padding: 24 }}>Oturum açılıyor...</p>;
}
