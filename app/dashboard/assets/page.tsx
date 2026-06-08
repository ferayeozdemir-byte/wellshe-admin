// app/dashboard/assets/page.tsx
import Link from "next/link";
import type { CSSProperties } from "react";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import AssetUploadClient from "./AssetUploadClient";
import DeleteAssetForm from "./DeleteAssetForm";

type AssetRow = {
  id: string;
  bucket: string;
  path: string;
  created_at: string | null;
  bytes: number | null;
  content_type: string | null;
  width: number | null;
  height: number | null;
  storage_provider: string | null;
  storage_key: string | null;
  public_url: string | null;
};

type SearchParamsRaw = {
  [key: string]: string | string[] | undefined;
};

type Props = {
  searchParams?: SearchParamsRaw | Promise<SearchParamsRaw>;
};

function getQueryParam(search: SearchParamsRaw, key: string): string | null {
  const raw = search[key];

  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0] ?? null;

  return null;
}

export default async function AssetsPage(props: Props) {
  await requireAdmin();

  const supabase = await createClient();

  const resolvedSearchParams = await Promise.resolve(props.searchParams ?? {});
  const mode = getQueryParam(resolvedSearchParams, "mode");
  const kind = getQueryParam(resolvedSearchParams, "kind");
  const returnToRaw = getQueryParam(resolvedSearchParams, "return_to");
  const returnTo = returnToRaw ? decodeURIComponent(returnToRaw) : null;
  const q = getQueryParam(resolvedSearchParams, "q")?.trim() ?? "";

  let query = supabase
    .from("assets")
    .select(
      "id,bucket,path,created_at,bytes,content_type,width,height,storage_provider,storage_key,public_url"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    const safeQ = q.replaceAll(",", " ");
    query = query.or(
      [
        `path.ilike.%${safeQ}%`,
        `content_type.ilike.%${safeQ}%`,
        `storage_provider.ilike.%${safeQ}%`,
        `storage_key.ilike.%${safeQ}%`,
        `public_url.ilike.%${safeQ}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;

  let assets: AssetRow[] = (data ?? []) as AssetRow[];

  if (mode === "pick" && kind === "cover") {
    assets = assets.filter((a) =>
      String(a.content_type ?? "").startsWith("image/")
    );
  } else if (mode === "pick" && kind === "audio") {
    assets = assets.filter((a) => {
      const ct = String(a.content_type ?? "").toLowerCase();
      return ct.startsWith("audio/") || ct === "video/mp4";
    });
  }

  const isPickMode = mode === "pick";

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Assets</h1>

        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          ← Dashboard
        </Link>

        {isPickMode && kind && returnTo && (
          <div
            style={{
              marginLeft: "auto",
              fontSize: 12,
              opacity: 0.75,
              textAlign: "right",
            }}
          >
            <div>
              <b>Pick mode:</b> {kind === "cover" ? "Cover" : "Audio"}
            </div>
            <div style={{ maxWidth: 320, wordBreak: "break-all" }}>
              Dönüş adresi: {returnTo}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <h2 style={{ marginBottom: 8, fontSize: 16 }}>
          Yeni Asset Yükle (Görsel + Ses)
        </h2>

        <AssetUploadClient />

        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          Not: Ses ve mp4 dosyaları Cloudflare R2’ye, görseller şimdilik
          Supabase <code>media</code> bucket’ına yüklenir. Tüm kayıtlar{" "}
          <code>assets</code> tablosuna kaydedilir.
        </div>
      </div>

      <form
        method="GET"
        style={{
          marginTop: 16,
          marginBottom: 16,
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {mode && <input type="hidden" name="mode" value={mode} />}
        {kind && <input type="hidden" name="kind" value={kind} />}
        {returnToRaw && <input type="hidden" name="return_to" value={returnToRaw} />}

        <input
          name="q"
          defaultValue={q}
          placeholder="Asset ara: dosya adı, uploads/..., r2, mp3, görsel..."
          style={{
            minWidth: 360,
            maxWidth: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            fontSize: 14,
          }}
        />

        <button type="submit" style={btn}>
          Ara
        </button>

        {q && (
          <Link
            href={
              isPickMode && kind && returnToRaw
                ? `/dashboard/assets?mode=${mode}&kind=${kind}&return_to=${encodeURIComponent(returnToRaw)}`
                : "/dashboard/assets"
            }
            style={btn}
          >
            Temizle
          </Link>
        )}

        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {assets.length} sonuç gösteriliyor
        </span>
      </form>
      {error && <p style={{ color: "crimson" }}>DB Error: {error.message}</p>}

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Path</th>
              <th style={th}>Type</th>
              <th style={th}>Size</th>
              <th style={th}>Created</th>
              <th style={th}>Provider</th>
              <th style={th}>URL</th>
              {isPickMode && <th style={th}>Select</th>}
              {!isPickMode && <th style={th}>Sil</th>}
            </tr>
          </thead>

          <tbody>
            {assets.map((a) => {
              const sizeMb =
                typeof a.bytes === "number"
                  ? `${(a.bytes / (1024 * 1024)).toFixed(2)} MB`
                  : "-";

              const typeLabel = a.content_type ?? "-";
              const providerLabel = a.storage_provider ?? "supabase";
              const fileName = a.path.split("/").pop() ?? a.path;
              const assetUrl = a.public_url;

              let pickHref: string | null = null;

              if (isPickMode && kind && returnTo) {
                const url = new URL(returnTo, "https://dummy-base.local");

                if (kind === "cover") {
                  url.searchParams.set("pickCover", a.id);
                } else if (kind === "audio") {
                  url.searchParams.set("pickAudio", a.id);
                }

                pickHref = url.pathname + url.search;
              }

              return (
                <tr key={a.id}>
                  <td style={td}>
                    <div style={{ fontWeight: 800 }}>{fileName}</div>
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.75,
                        marginTop: 4,
                        wordBreak: "break-all",
                      }}
                    >
                      {a.path}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.55,
                        marginTop: 4,
                      }}
                    >
                      id: {a.id}
                    </div>
                  </td>

                  <td style={td}>{typeLabel}</td>

                  <td style={td}>{sizeMb}</td>

                  <td style={td}>
                    {a.created_at
                      ? new Date(a.created_at).toLocaleString("tr-TR")
                      : "-"}
                  </td>

                  <td style={td}>
                    <span
                      style={{
                        fontWeight: 800,
                        color: providerLabel === "r2" ? "#047857" : "#555",
                      }}
                    >
                      {providerLabel}
                    </span>
                  </td>

                  <td style={td}>
                    {assetUrl ? (
                      <a
                        href={assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={btn}
                      >
                        Aç
                      </a>
                    ) : (
                      <span style={{ opacity: 0.55 }}>URL yok</span>
                    )}
                  </td>

                  {isPickMode && (
                    <td style={td}>
                      {pickHref ? (
                        <Link href={pickHref} style={btn}>
                          Seç
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                  )}

                  {!isPickMode && (
                    <td style={td}>
                      <DeleteAssetForm
                        id={a.id}
                        bucket={a.bucket}
                        path={a.path}
                        storageProvider={a.storage_provider}
                      />
                    </td>
                  )}
                </tr>
              );
            })}

            {assets.length === 0 && (
              <tr>
                <td style={td} colSpan={7}>
                  Henüz asset yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "10px 8px",
  fontWeight: 700,
};

const td: CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "10px 8px",
  verticalAlign: "top",
  fontSize: 13,
};

const btn: CSSProperties = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  textDecoration: "none",
  display: "inline-block",
  color: "#111",
  fontSize: 12,
  fontWeight: 700,
  background: "#fff",
  cursor: "pointer",
};