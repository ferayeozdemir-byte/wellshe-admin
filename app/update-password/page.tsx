export const dynamic = "force-dynamic";
export const revalidate = 0;
import { updatePassword } from "./actions";

export default function UpdatePasswordPage({
  searchParams,
}: {
  searchParams?: { error?: string; success?: string };
}) {
  const error = searchParams?.error;
  const success = searchParams?.success;

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1>Yeni Şifre</h1>

      <form action={updatePassword}>
        <input
          type="password"
          name="password"
          placeholder="Yeni şifre"
          required
          minLength={6}
          style={{ width: "100%", padding: 10, border: "1px solid #ccc", marginTop: 12 }}
        />

        <input
          type="password"
          name="confirm"
          placeholder="Yeni şifre (tekrar)"
          required
          minLength={6}
          style={{ width: "100%", padding: 10, border: "1px solid #ccc", marginTop: 12 }}
        />

        <button
          type="submit"
          style={{ width: "100%", padding: 10, marginTop: 12 }}
        >
          Kaydet
        </button>
      </form>

      {error && <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>}
      {success && <p style={{ marginTop: 12, color: "green" }}>{success}</p>}
    </div>
  );
}
