import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      bucket,
      path,
      bytes,
      contentType,
      storageProvider,
      storageKey,
      publicUrl,
    } = body as {
      bucket: string;
      path: string;
      bytes: number;
      contentType: string | null;
      storageProvider?: string | null;
      storageKey?: string | null;
      publicUrl?: string | null;
    };

    if (!bucket || !path) {
      return NextResponse.json(
        { error: "bucket ve path zorunlu" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("assets")
      .insert({
        bucket,
        path,
        bytes,
        content_type: contentType,
        storage_provider: storageProvider ?? "supabase",
        storage_key: storageKey ?? path,
        public_url: publicUrl ?? null,
      })
      .select("id,bucket,path,content_type,bytes,storage_provider,storage_key,public_url")
      .single();

    if (error) {
      console.error("DB insert error:", error);

      return NextResponse.json(
        { error: "DB insert error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, asset: data });
  } catch (err: unknown) {
    console.error(err);

    const details = err instanceof Error ? err.message : String(err);

    return NextResponse.json(
      { error: "Unexpected error", details },
      { status: 500 }
    );
  }
}