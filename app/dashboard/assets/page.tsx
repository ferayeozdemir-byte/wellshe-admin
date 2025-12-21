import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listAssets, uploadAsset, deleteAsset } from "./actions";

export default async function AssetsPage() {
  await requireAdmin();

  const assets = await listAssets();

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <h1>Assets</h1>
      <p>
        Buradan görsel / ses yükleyin. Yüklenen dosyalar Storage’daki <b>media</b>{" "}
        bucket’ına gider ve <b>assets</b> tablosuna kaydedilir.
      </p>

      <form
        action={uploadAsset}
        encType="multipart/form-data"
        style={{ marginTop: 16, marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}
      >
        <input type="file" name="file" accept="image/*,audio/*" required />
        <button
          type="submit"
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 700,
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
          {assets.map((a) => {
            const ct = String(a.content_type ?? "");
            const isImg = ct.startsWith("image/");
            const isAudio = ct.startsWith("audio/");

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
                      <span style={{ fontSize: 12, color: "#666" }}>AUDIO</span>
                    ) : (
                      <span style={{ fontSize: 12, color: "#666" }}>FILE</span>
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

                  <form action={deleteAsset} style={{ display: "flex", justifyContent: "flex-end" }}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="bucket" value={a.bucket} />
                    <input type="hidden" name="path" value={a.path} />
                    <button
                      type="submit"
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid rgba(220,20,60,0.35)",
                        background: "rgba(220,20,60,0.08)",
                        color: "crimson",
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      Sil
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
