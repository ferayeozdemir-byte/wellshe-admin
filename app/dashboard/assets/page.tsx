import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listAssets, uploadAsset } from "./actions";

export default async function AssetsPage() {
  await requireAdmin();

  const assets = await listAssets();

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <h1>Assets</h1>
      <p>Buradan görsel yükleyin. Yüklenen görseller Storage’daki <b>media</b> bucket’ına gider ve <b>assets</b> tablosuna kaydedilir.</p>

      <form action={uploadAsset} style={{ marginTop: 16, marginBottom: 24 }}>
        <input type="file" name="file" accept="image/*" required />
        <button
          type="submit"
          style={{
            marginLeft: 12,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: "pointer",
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
          {assets.map((a) => (
            <div
              key={a.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: 12,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 100,
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "#f6f6f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {a.publicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.publicUrl}
                    alt={a.path}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "#999" }}>no preview</span>
                )}
              </div>

              <div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  <div><b>Bucket:</b> {a.bucket}</div>
                  <div><b>Path:</b> {a.path}</div>
                  <div><b>Type:</b> {a.content_type ?? "-"}</div>
                  <div><b>Bytes:</b> {a.bytes ?? "-"}</div>
                  <div><b>Created:</b> {a.created_at ?? "-"}</div>
                </div>

                {a.publicUrl ? (
                  <div style={{ marginTop: 10 }}>
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
          ))}
        </div>
      )}
    </div>
  );
}
