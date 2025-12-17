import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AssetsPage() {
  await requireAdmin();

  return (
    <div style={{ padding: 24 }}>
      <h1>Assets</h1>
      <p>Bu sayfa şimdilik placeholder. Sonraki adımda görsel upload ekranını ekleyeceğiz.</p>
    </div>
  );
}
