import { requireAdmin } from "@/lib/auth/requireAdmin";
import { deleteAsset, listAssets, uploadAsset } from "./actions";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const assets = await listAssets();

  const errRaw = searchParams?.err;
  const err = typeof errRaw === "string" ? decodeURIComponent(errRaw) : null;

  const okRaw = searchParams?.ok;
  const ok = typeof okRaw === "string" ? okRaw : null;

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <h1>Assets</h1>
      <p>
        Buradan dosya yükleyin. Yüklenenler Storage’daki <b>media</b> bucket’ına gider ve{" "}
        <b>assets</b> tablosuna kaydedilir.
      </p>

      {err ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(220,20,60,0.35)",
            background: "rgba(220,20,60,0.08)",
            color: "crimson",
            fontWeight: 900,
          }}
        >
          Hata: {err}
        </div>
      ) : null}

      {ok ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "rgba(0,0,0,0.03)",
            color: "#111",
            fontWeight: 900,
          }}
        >
          İşlem başarılı ✅
        </div>
      ) : null}

      <form
        action={uploadAsset}
        encType="multipart/form-data"
        style={{ marginTop: 16, marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}
      >
        {/* sadece image değil; audio da yükleyebil */}
        <input type="file" name="file" accept="image/*,audio/*,.mp3,.mpeg" required />
        <button
          type="submit"
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 900,
            background: "#fff",
          }}
        >
          Upload
        </button>
      </form>

      <h2 style={{ marginTop: 24 }}>Son yüklenenler</h2>

      {assets.length === 0 ? (
        <p>Henüz asset yok.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {assets.map((a: any) => {
            const isImage = String(a.content_type ?? "").startsWith("image/");
            const isAudio = String(a.content_type ?? "").startsWith("audio/");

            return (
              <div
                key={a.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "92px 1fr",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    width: 92,
                    height: 72,
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#f6f6f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #eee",
                  }}
                >
                  {isImage && a.publicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.publicUrl}
                      alt={a.path}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.65 }}>
                      {isAudio ? "AUDIO" : "FILE"}
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        <div>
                          <b>Bucket:</b> {a.bucket}
                        </div>
                        <div style={{ wordBreak: "break-all" }}>
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
                    </div>

                    <form action={deleteAsset}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="bucket" value={a.bucket} />
                      <input type="hidden" name="path" value={a.path} />
                      <button
                        type="submit"
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid rgba(220,20,60,0.35)",
                          background: "rgba(220,20,60,0.08)",
                          color: "crimson",
                          cursor: "pointer",
                          fontWeight: 900,
                        }}
                      >
                        Sil
                      </button>
                    </form>
                  </div>

                  {a.publicUrl ? (
                    <div>
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                        Public URL:
                      </div>
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
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
