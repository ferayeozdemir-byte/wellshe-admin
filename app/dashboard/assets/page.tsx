import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listAssets } from "./actions";
import DeleteAssetForm from "./DeleteAssetForm";
import AssetUploadClient from "./AssetUploadClient";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams?:
    | { [key: string]: string | string[] | undefined }
    | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();

  const assets = await listAssets();

  // 🔑 Next 16: searchParams Promise olabiliyor → önce çöz
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});

  const modeRaw = resolvedSearchParams.mode;
  const mode = typeof modeRaw === "string" ? modeRaw : null;

  const kindRaw = resolvedSearchParams.kind; // "cover" | "audio"
  const kind = typeof kindRaw === "string" ? (kindRaw as "cover" | "audio") : null;

  const returnToRaw = resolvedSearchParams.return_to;
  const return_to = typeof returnToRaw === "string" ? returnToRaw : null;

  const isPickMode = mode === "pick" && !!kind && !!return_to;

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Assets</h1>

        {isPickMode ? (
          <Link
            href={return_to!}
            style={{
              textDecoration: "none",
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              fontWeight: 800,
              color: "#111",
              background: "#fff",
            }}
          >
            ← Edit sayfasına geri
          </Link>
        ) : null}
      </div>

      <p style={{ marginTop: 12 }}>
        Buradan görsel / ses yükleyin. Yüklenen dosyalar Storage’daki <b>media</b>{" "}
        bucket’ına gider ve <b>assets</b> tablosuna kaydedilir.
        {isPickMode ? (
          <>
            {" "}
            <b>
              (Seçim modu açık: {kind === "cover" ? "Kapak" : "Ses"} seçiyorsunuz)
            </b>
          </>
        ) : null}
      </p>

      {/* 📦 Upload işlemini artık client-side bileşen yapıyor */}
      <AssetUploadClient />

      <h2 style={{ marginTop: 24 }}>Son yüklenenler</h2>

      {assets.length === 0 ? (
        <p>Henüz asset yok.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {assets.map((a) => {
            const ct = String(a.content_type ?? "");
            const isImg = ct.startsWith("image/");
            const isAudio = ct.startsWith("audio/");

            // Seçim modunda: cover ise sadece image; audio ise sadece audio gösterelim
            if (isPickMode) {
              if (kind === "cover" && !isImg) return null;
              if (kind === "audio" && !isAudio) return null;
            }

            const pickHref =
              isPickMode && return_to
                ? `${return_to}?${
                    kind === "cover" ? "pickCover" : "pickAudio"
                  }=${encodeURIComponent(a.id)}`
                : null;

            return (
              <div
                key={a.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "96px 1fr",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 72,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#f6f6f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {a.publicUrl ? (
                    isImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.publicUrl}
                        alt={a.path}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : isAudio ? (
                      <span style={{ fontSize: 12, color: "#666", fontWeight: 800 }}>
                        AUDIO
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "#666", fontWeight: 800 }}>
                        FILE
                      </span>
                    )
                  ) : (
                    <span style={{ color: "#999", fontSize: 12 }}>no preview</span>
                  )}
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    <div>
                      <b>Path:</b> {a.path}
                    </div>
                    <div>
                      <b>Type:</b> {a.content_type ?? "-"}
                    </div>
                    <div>
                      <b>Bytes:</b> {a.bytes ?? "-"}
                    </div>
                    <div>
                      <b>Created:</b> {a.created_at ?? "-"}
                    </div>
                  </div>

                  {a.publicUrl && isAudio ? (
                    <audio controls src={a.publicUrl} style={{ width: "100%" }} />
                  ) : null}

                  {a.publicUrl ? (
                    <input
                      readOnly
                      value={a.publicUrl}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        fontSize: 12,
                      }}
                    />
                  ) : null}

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {pickHref ? (
                      <Link
                        href={pickHref}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #111",
                          background: "#111",
                          color: "#fff",
                          textDecoration: "none",
                          fontWeight: 900,
                        }}
                      >
                        Seç
                      </Link>
                    ) : null}

                    <DeleteAssetForm id={a.id} bucket={a.bucket} path={a.path} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
