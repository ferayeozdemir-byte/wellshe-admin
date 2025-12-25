import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // sende service role ile çalışan helper

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

    const supabase = await createClient();

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
