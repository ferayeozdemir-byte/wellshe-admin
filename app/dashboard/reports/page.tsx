// app/dashboard/reports/page.tsx

import { requireAdmin } from "@/lib/auth/requireAdmin";
import Link from "next/link";
import type { CSSProperties } from "react";
import DownloadCsvButton from "./DownloadCsvButton";

type ReportRow = {
  sort_order: number;
  section: string;
  label: string;
  value_1: string | null;
  value_2: string | null;
};

type SearchParams = {
  start?: string | string[];
  end?: string | string[];
};

type ReportsPageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

const SECTION_ORDER = [
  "Genel Özet",
  "Sayfa Performansı",
  "İçerik Performansı",
  "Kategori Performansı",
  "Haftanın Önerileri",
  "Pratikler / Dinleme Performansı",
  "Sponsor Görünürlüğü",
  "Özellik Kullanımı",
  "Altyapı Özeti",
];

const SECTION_EMPTY_MESSAGES: Record<string, string> = {
  "Sayfa Performansı":
    "Bu tarih aralığında sayfa görüntüleme ya da süre verisi yok.",
  "İçerik Performansı":
    "Bu tarih aralığında içerik açılışı ya da içerik süre verisi yok.",
  "Kategori Performansı":
    "Bu tarih aralığında kategori tıklaması ya da kategori ekran verisi yok.",
  "Haftanın Önerileri":
    "Bu tarih aralığında haftanın önerileri için veri yok.",
  "Pratikler / Dinleme Performansı":
    "Bu tarih aralığında veri yok. Bu alan, pratik eventleri canlı sürüme çıktıktan sonra dolmaya başlayacak.",
  "Sponsor Görünürlüğü":
    "Bu tarih aralığında sponsor görüntülenme/tıklama verisi yok.",
  "Özellik Kullanımı":
    "Bu tarih aralığında özellik kullanımı verisi yok.",
  "Altyapı Özeti": "Altyapı özeti verisi bulunamadı.",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 29);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function isDateInputValue(value: string | undefined) {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeDateRange(params: SearchParams | undefined) {
  const defaults = getDefaultDateRange();

  let startDate = isDateInputValue(getStringParam(params?.start))
    ? String(getStringParam(params?.start))
    : defaults.startDate;

  let endDate = isDateInputValue(getStringParam(params?.end))
    ? String(getStringParam(params?.end))
    : defaults.endDate;

  if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
    const temp = startDate;
    startDate = endDate;
    endDate = temp;
  }

  return { startDate, endDate };
}

function getPresetRange(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));

  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  };
}

function getThisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    start: toDateInputValue(start),
    end: toDateInputValue(now),
  };
}

function rangeHref(start: string, end: string) {
  return `/dashboard/reports?start=${start}&end=${end}`;
}

function formatLabel(label: string) {
  const labels: Record<string, string> = {
    home: "Ana Sayfa",
    root: "Uygulama Başlangıcı",
    period: "Regl Ekranı",
    article: "İçerik Ekranı",
    calorie: "Kalori Ekranı",
    category: "Kategori Ekranı",
    search: "Arama Ekranı",
    practices: "Pratikler Ana Sayfası",
    practices_list: "Pratik Liste Ekranı",
    practice_player: "Pratik Player",
    weekly_movie: "Haftanın Dizi / Film Sayfası",
    weekly_music: "Haftanın Müzik Sayfası",
    weekly_book: "Haftanın Kitap Sayfası",
    sponsor_splash: "Sponsor Açılış Ekranı",

    water_reminder_click: "Su Hatırlatıcı Tıklaması",
    move_reminder_click: "Hareket Hatırlatıcı Tıklaması",
    category_click: "Kategori Tıklaması",
    category_article_click: "Kategori İçerik Tıklaması",
    category_load_more_click: "Kategori Daha Fazla Göster",
    calorie_card_click: "Kalori Kartı Tıklaması",
    period_card_click: "Regl Kartı Tıklaması",
    practices_card_click: "Pratikler Kartı Tıklaması",
    profile_click: "Profil Tıklaması",
    home_search_submit: "Ana Sayfa Arama",
    latest_article_click: "Son Eklenen İçerik Tıklaması",

    weekly_movie_click: "Haftanın Dizi / Film Tıklaması",
    weekly_music_click: "Haftanın Müzik Tıklaması",
    weekly_book_click: "Haftanın Kitap Tıklaması",
    weekly_screen_view: "Haftalık Öneri Görüntüleme",

    practice_home_open: "Pratikler Ana Sayfa Açılışı",
    practice_kind_click: "Pratik Türü Tıklaması",
    practice_list_open: "Pratik Liste Açılışı",
    practice_open: "Pratik Açılışı",
    practice_player_open: "Pratik Player Açılışı",
    practice_audio_play: "Pratik Ses Play",
    practice_audio_pause: "Pratik Ses Pause",
    practice_audio_complete: "Pratik Tamamlama",
    practice_seek: "Pratik İleri/Geri Sarma",

    sponsor_view: "Sponsor Görüntülenme",
    sponsor_splash_completed: "Sponsor Splash Tamamlanma",
    sponsor_click: "Sponsor Tıklama",
  };

  return labels[label] ?? label;
}

function getValue2Title(section: string) {
  if (section === "Genel Özet") return "Açıklama";
  if (section === "Altyapı Özeti") return "Açıklama";
  return "Tekil / Not";
}

function getSectionBaseSortOrder(section: string) {
  const index = SECTION_ORDER.indexOf(section);
  return index >= 0 ? index * 1000 : 999999;
}

function buildCsvRows(sections: Record<string, ReportRow[]>) {
  return SECTION_ORDER.flatMap((section) => {
    const sectionRows = sections[section] ?? [];

    if (sectionRows.length > 0) {
      return sectionRows;
    }

    if (section === "Genel Özet") {
      return [];
    }

    return [
      {
        sort_order: getSectionBaseSortOrder(section),
        section,
        label: "Veri yok",
        value_1:
          SECTION_EMPTY_MESSAGES[section] ??
          "Bu tarih aralığında veri bulunamadı.",
        value_2: "",
      },
    ];
  });
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const resolvedSearchParams = await searchParams;
  const { startDate, endDate } = normalizeDateRange(resolvedSearchParams);

  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc("get_sponsor_report", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  const rows: ReportRow[] = ((data ?? []) as ReportRow[])
    .map((row) => ({
      ...row,
      label: formatLabel(row.label),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  const sections = rows.reduce<Record<string, ReportRow[]>>((acc, row) => {
    if (!acc[row.section]) acc[row.section] = [];
    acc[row.section].push(row);
    return acc;
  }, {});

  const csvRows = buildCsvRows(sections);

  const last7 = getPresetRange(7);
  const last30 = getPresetRange(30);
  const last90 = getPresetRange(90);
  const thisMonth = getThisMonthRange();

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
          <DownloadCsvButton
            rows={csvRows}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>

      <p style={{ marginTop: 12, maxWidth: 860, lineHeight: 1.6, opacity: 0.8 }}>
        Bu rapor seçilen tarih aralığına göre Supabase event ölçüm sisteminden
        otomatik hesaplanır. Toplam indirme verisi App Store Connect ve Google
        Play Console kaynaklı manuel metrik olarak gösterilir. Yeni süre ve
        pratik verileri, mobil güncelleme kullanıcılara ulaştıktan sonra
        dolmaya başlar.
      </p>

      <section style={filterCard}>
        <form
          method="get"
          style={{
            display: "flex",
            gap: 12,
            alignItems: "end",
            flexWrap: "wrap",
          }}
        >
          <label style={labelStyle}>
            Başlangıç tarihi
            <input
              type="date"
              name="start"
              defaultValue={startDate}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Bitiş tarihi
            <input
              type="date"
              name="end"
              defaultValue={endDate}
              style={inputStyle}
            />
          </label>

          <button type="submit" style={primaryButton}>
            Raporu Getir
          </button>

          <div style={presetWrap}>
            <Link href={rangeHref(last7.start, last7.end)} style={presetLink}>
              Son 7 gün
            </Link>
            <Link href={rangeHref(last30.start, last30.end)} style={presetLink}>
              Son 30 gün
            </Link>
            <Link href={rangeHref(last90.start, last90.end)} style={presetLink}>
              Son 90 gün
            </Link>
            <Link
              href={rangeHref(thisMonth.start, thisMonth.end)}
              style={presetLink}
            >
              Bu ay
            </Link>
          </div>
        </form>

        <div style={{ marginTop: 12, fontSize: 13, opacity: 0.72 }}>
          Gösterilen aralık: <strong>{startDate}</strong> -{" "}
          <strong>{endDate}</strong>
        </div>
      </section>

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
          Bu tarih aralığında genel rapor verisi bulunamadı. Bölümlerde boş
          alan açıklamalarını görebilirsin.
        </div>
      )}

      <div style={{ marginTop: 24, display: "grid", gap: 24 }}>
        {SECTION_ORDER.map((section) => {
          const sectionRows = sections[section] ?? [];
          const hasRows = sectionRows.length > 0;

          return (
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
                        {section === "Genel Özet" ? "Değer" : "Toplam / Özet"}
                      </th>
                      <th style={th}>{getValue2Title(section)}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {hasRows ? (
                      sectionRows.map((row) => (
                        <tr
                          key={`${row.sort_order}-${row.section}-${row.label}`}
                        >
                          <td style={td}>{row.label}</td>
                          <td style={tdStrong}>{row.value_1 ?? "-"}</td>
                          <td style={td}>{row.value_2 ?? "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={tdMuted}>Veri yok</td>
                        <td style={tdMuted}>
                          {SECTION_EMPTY_MESSAGES[section] ??
                            "Bu tarih aralığında veri bulunamadı."}
                        </td>
                        <td style={tdMuted}>-</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

const filterCard: CSSProperties = {
  marginTop: 18,
  padding: 16,
  borderRadius: 14,
  border: "1px solid #eee",
  background: "#fafafa",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
};

const inputStyle: CSSProperties = {
  height: 40,
  borderRadius: 10,
  border: "1px solid #ddd",
  padding: "0 10px",
  fontSize: 14,
  background: "#fff",
};

const primaryButton: CSSProperties = {
  height: 40,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const presetWrap: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const presetLink: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fff",
  color: "#111",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 700,
};

const th: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #eee",
  padding: "10px 12px",
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: "nowrap",
};

const td: CSSProperties = {
  borderBottom: "1px solid #f1f1f1",
  padding: "10px 12px",
  verticalAlign: "top",
  fontSize: 14,
  lineHeight: 1.5,
};

const tdStrong: CSSProperties = {
  ...td,
  fontWeight: 800,
};

const tdMuted: CSSProperties = {
  ...td,
  color: "#777",
  background: "#fcfcfc",
};