// app/dashboard/reports/page.tsx

import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import DownloadCsvButton from "./DownloadCsvButton";

type ReportRow = {
  sort_order: number;
  section: string;
  label: string;
  value_1: string | null;
  value_2: string | null;
};

function formatLabel(label: string) {
  const labels: Record<string, string> = {
    home: "Ana Sayfa",
    root: "Uygulama Başlangıcı",
    period: "Regl Ekranı",
    article: "İçerik Ekranı",
    water_reminder_click: "Su Hatırlatıcı Tıklaması",
    move_reminder_click: "Hareket Hatırlatıcı Tıklaması",
  };

  return labels[label] ?? label;
}

function getValue2Title(section: string) {
  if (section === "Genel Özet") return "";
  return "Tekil Kurulum";
}

export default async function ReportsPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("sponsor_report_last_30_days")
    .select("sort_order,section,label,value_1,value_2")
    .order("sort_order", { ascending: true });

  const rows: ReportRow[] = ((data ?? []) as ReportRow[]).map((row) => ({
    ...row,
    label: formatLabel(row.label),
  }));

  const sections = rows.reduce<Record<string, ReportRow[]>>((acc, row) => {
    if (!acc[row.section]) acc[row.section] = [];
    acc[row.section].push(row);
    return acc;
  }, {});

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>Raporlar</h1>

        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          ← Dashboard
        </Link>

        <div style={{ marginLeft: "auto" }}>
          <DownloadCsvButton rows={rows} />
        </div>
      </div>

      <p style={{ marginTop: 12, maxWidth: 780, lineHeight: 1.6, opacity: 0.8 }}>
        Bu rapor Supabase event ölçüm sistemine göre son 30 günü otomatik
        hesaplar. Sponsor sunumlarında “tekil aktif kurulum” ifadesini
        kullanmak daha doğru olur.
      </p>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #f3b6b6",
            background: "#fff3f3",
            color: "#9f1d1d",
          }}
        >
          DB Error: {error.message}
        </div>
      )}

      {!error && rows.length === 0 && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #eee",
            background: "#fafafa",
          }}
        >
          Henüz rapor verisi bulunamadı.
        </div>
      )}

      <div style={{ marginTop: 24, display: "grid", gap: 24 }}>
        {Object.entries(sections).map(([section, sectionRows]) => (
          <section
            key={section}
            style={{
              border: "1px solid #eee",
              borderRadius: 14,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #eee",
                background: "#fafafa",
                fontWeight: 800,
              }}
            >
              {section}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Başlık</th>
                    <th style={th}>
                      {section === "Genel Özet" ? "Değer" : "Toplam"}
                    </th>
                    {section !== "Genel Özet" && (
                      <th style={th}>{getValue2Title(section)}</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {sectionRows.map((row) => (
                    <tr key={`${row.section}-${row.label}`}>
                      <td style={td}>{row.label}</td>
                      <td style={tdStrong}>{row.value_1 ?? "-"}</td>
                      {section !== "Genel Özet" && (
                        <td style={td}>{row.value_2 ?? "-"}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #eee",
  padding: "10px 12px",
  fontWeight: 700,
  fontSize: 13,
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #f1f1f1",
  padding: "10px 12px",
  verticalAlign: "top",
  fontSize: 14,
};

const tdStrong: React.CSSProperties = {
  ...td,
  fontWeight: 800,
};