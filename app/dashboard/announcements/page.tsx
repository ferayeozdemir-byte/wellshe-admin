import { requireAdmin } from "@/lib/auth/requireAdmin";
import Link from "next/link";
import type { CSSProperties } from "react";
import { createAnnouncement, updateAnnouncement } from "./actions";
import DeleteAnnouncementForm from "./DeleteAnnouncementForm";

type AnnouncementStatus = "draft" | "published" | "archived";

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  status: AnnouncementStatus;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

const ADMIN_TIME_ZONE = "Europe/Istanbul";

function getIstanbulDateTimeParts(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");

  if (!year || !month || !day || !hour || !minute) return null;

  return {
    year,
    month,
    day,
    hour: hour === "24" ? "00" : hour,
    minute,
  };
}

function formatDateTimeLocal(value: string | null) {
  const parts = getIstanbulDateTimeParts(value);
  if (!parts) return "";

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function formatDisplayDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ADMIN_TIME_ZONE,
  });
}

function getStatusLabel(status: AnnouncementStatus) {
  if (status === "published") return "Yayında";
  if (status === "archived") return "Arşiv";
  return "Taslak";
}

function getStatusStyle(status: AnnouncementStatus): CSSProperties {
  if (status === "published") {
    return {
      background: "#E8F7ED",
      color: "#1F7A3A",
      borderColor: "#B8E1C4",
    };
  }

  if (status === "archived") {
    return {
      background: "#F3F3F3",
      color: "#666",
      borderColor: "#DDD",
    };
  }

  return {
    background: "#FFF7E8",
    color: "#9A6300",
    borderColor: "#F0D29B",
  };
}

export default async function AnnouncementsPage() {
  const { supabase } = await requireAdmin(["admin", "editor"]);

  const { data, error } = await supabase
    .from("announcements")
    .select(
      "id,title,body,status,priority,starts_at,ends_at,created_at,updated_at"
    )
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  const announcements = ((data ?? []) as AnnouncementRow[]).map((item) => ({
    ...item,
    status: item.status ?? "draft",
    priority: item.priority ?? 0,
  }));

  return (
    <div style={page}>
      <div style={topRow}>
        <h1 style={{ margin: 0 }}>Duyurular</h1>

        <Link href="/dashboard" style={linkStyle}>
          ← Dashboard
        </Link>
      </div>

      <p style={description}>
        Buradan eklediğin yayındaki duyurular mobil uygulamada ana sayfadaki zil
        alanında görünecek. Taslak duyurular kullanıcıya gösterilmez.
      </p>

      {error ? (
        <div style={errorBox}>DB Error: {error.message}</div>
      ) : null}

      <section style={card}>
        <h2 style={cardTitle}>Yeni Duyuru Ekle</h2>

        <form action={createAnnouncement} style={formGrid}>
          <label style={field}>
            Başlık
            <input
              name="title"
              required
              placeholder="Örn: Yeni meditasyon pratikleri yayında"
              style={input}
            />
          </label>

          <label style={field}>
            Durum
            <select name="status" defaultValue="draft" style={input}>
              <option value="draft">Taslak</option>
              <option value="published">Yayında</option>
              <option value="archived">Arşiv</option>
            </select>
          </label>

          <label style={field}>
            Öncelik
            <input
              name="priority"
              type="number"
              defaultValue={0}
              style={input}
            />
          </label>

          <label style={field}>
            Başlangıç tarihi (Türkiye saati)
            <input name="starts_at" type="datetime-local" style={input} />
          </label>

          <label style={field}>
            Bitiş tarihi (Türkiye saati)
            <input name="ends_at" type="datetime-local" style={input} />
          </label>

          <label style={{ ...field, gridColumn: "1 / -1" }}>
            Duyuru metni
            <textarea
              name="body"
              required
              rows={5}
              placeholder="Duyuru metnini buraya yaz..."
              style={textarea}
            />
          </label>

          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" style={primaryButton}>
              Duyuruyu Kaydet
            </button>
          </div>
        </form>
      </section>

      <section style={{ display: "grid", gap: 16 }}>
        <h2 style={{ margin: "8px 0 0" }}>Mevcut Duyurular</h2>

        {announcements.length === 0 ? (
          <div style={emptyBox}>Henüz duyuru yok.</div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} style={card}>
              <div style={announcementHeader}>
                <div>
                  <div style={announcementTitleRow}>
                    <h3 style={{ margin: 0 }}>{announcement.title}</h3>
                    <span
                      style={{
                        ...statusBadge,
                        ...getStatusStyle(announcement.status),
                      }}
                    >
                      {getStatusLabel(announcement.status)}
                    </span>
                  </div>

                  <div style={metaText}>
                    Öncelik: {announcement.priority} · Oluşturulma:{" "}
                    {formatDisplayDate(announcement.created_at)} · Güncelleme:{" "}
                    {formatDisplayDate(announcement.updated_at)}
                  </div>
                </div>
              </div>

              <form action={updateAnnouncement} style={formGrid}>
                <input type="hidden" name="id" value={announcement.id} />

                <label style={field}>
                  Başlık
                  <input
                    name="title"
                    required
                    defaultValue={announcement.title}
                    style={input}
                  />
                </label>

                <label style={field}>
                  Durum
                  <select
                    name="status"
                    defaultValue={announcement.status}
                    style={input}
                  >
                    <option value="draft">Taslak</option>
                    <option value="published">Yayında</option>
                    <option value="archived">Arşiv</option>
                  </select>
                </label>

                <label style={field}>
                  Öncelik
                  <input
                    name="priority"
                    type="number"
                    defaultValue={announcement.priority}
                    style={input}
                  />
                </label>

                <label style={field}>
                  Başlangıç tarihi (Türkiye saati)
                  <input
                    name="starts_at"
                    type="datetime-local"
                    defaultValue={formatDateTimeLocal(announcement.starts_at)}
                    style={input}
                  />
                </label>

                <label style={field}>
                  Bitiş tarihi (Türkiye saati)
                  <input
                    name="ends_at"
                    type="datetime-local"
                    defaultValue={formatDateTimeLocal(announcement.ends_at)}
                    style={input}
                  />
                </label>

                <label style={{ ...field, gridColumn: "1 / -1" }}>
                  Duyuru metni
                  <textarea
                    name="body"
                    required
                    rows={5}
                    defaultValue={announcement.body}
                    style={textarea}
                  />
                </label>

                <div style={actionRow}>
                  <button type="submit" style={primaryButton}>
                    Güncelle
                  </button>
                </div>
              </form>

              <DeleteAnnouncementForm
                id={announcement.id}
                title={announcement.title}
              />
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const page: CSSProperties = {
  padding: 24,
  display: "grid",
  gap: 20,
};

const topRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const linkStyle: CSSProperties = {
  color: "#111",
  textDecoration: "none",
  fontWeight: 700,
};

const description: CSSProperties = {
  maxWidth: 860,
  lineHeight: 1.6,
  opacity: 0.8,
  margin: 0,
};

const card: CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  background: "#fff",
  padding: 18,
};

const cardTitle: CSSProperties = {
  margin: "0 0 14px",
};

const formGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const field: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
};

const input: CSSProperties = {
  minHeight: 42,
  borderRadius: 10,
  border: "1px solid #ddd",
  padding: "0 12px",
  fontSize: 14,
  background: "#fff",
};

const textarea: CSSProperties = {
  borderRadius: 10,
  border: "1px solid #ddd",
  padding: 12,
  fontSize: 14,
  lineHeight: 1.5,
  resize: "vertical",
  background: "#fff",
};

const primaryButton: CSSProperties = {
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const errorBox: CSSProperties = {
  border: "1px solid #f3b6b6",
  background: "#fff3f3",
  color: "#9f1d1d",
  padding: 12,
  borderRadius: 12,
};

const emptyBox: CSSProperties = {
  border: "1px solid #eee",
  background: "#fafafa",
  padding: 16,
  borderRadius: 12,
};

const announcementHeader: CSSProperties = {
  marginBottom: 16,
};

const announcementTitleRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 6,
};

const statusBadge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  border: "1px solid",
  padding: "4px 8px",
  fontSize: 12,
  fontWeight: 800,
};

const metaText: CSSProperties = {
  fontSize: 12,
  color: "#777",
};

const actionRow: CSSProperties = {
  gridColumn: "1 / -1",
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};