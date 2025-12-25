import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Bu endpoint sadece server’da çalışıyor, burada service_role kullanabiliriz
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service key ile çalışan tam yetkili Supabase client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bucket, path, bytes, contentType } = body as {
      bucket: string;
      path: string;
      bytes: number;
      contentType: string | null;
    };

    if (!bucket || !path) {
      return NextResponse.json(
        { error: "bucket ve path zorunlu" },
        { status: 400 }
      );
    }

    // 🔐 service_role ile çağırdığımız için RLS bu client için devre dışı
    const { error } = await supabase.from("assets").insert({
      bucket,
      path,
      bytes,
      content_type: contentType,
    });

    if (error) {
      console.error("DB insert error:", error);
      return NextResponse.json(
        { error: "DB insert error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Unexpected error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
