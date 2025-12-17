"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    async function run() {
      // 1) URL query (?code=...)
      const code = params.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // 2) URL hash (#access_token=...)
      const hash = window.location.hash?.slice(1) || "";
      const hp = new URLSearchParams(hash);
      const access_token = hp.get("access_token");
      const refresh_token = hp.get("refresh_token");

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }

      const next = params.get("next") ?? "/dashboard";
      router.replace(next);
    }

    run();
  }, []);

  return <p style={{ padding: 24 }}>Oturum açılıyor...</p>;
}
