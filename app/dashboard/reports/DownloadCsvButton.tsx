"use client";

type ReportRow = {
  sort_order: number;
  section: string;
  label: string;
  value_1: string | null;
  value_2: string | null;
};

function escapeCsv(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: ReportRow[]) {
  const headers = ["Bölüm", "Başlık", "Toplam / Değer", "Tekil / Açıklama"];

  const body = rows.map((row) => [
    row.section,
    row.label,
    row.value_1 ?? "",
    row.value_2 ?? "",
  ]);

  return [headers, ...body]
    .map((line) => line.map(escapeCsv).join(","))
    .join("\n");
}

function getFileName(startDate: string, endDate: string) {
  return `wellshe-sponsor-report-${startDate}-${endDate}.csv`;
}

export default function DownloadCsvButton({
  rows,
  startDate,
  endDate,
}: {
  rows: ReportRow[];
  startDate: string;
  endDate: string;
}) {
  function downloadCsv() {
    const csv = toCsv(rows);
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = getFileName(startDate, endDate);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={downloadCsv}
      disabled={rows.length === 0}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #111",
        background: rows.length === 0 ? "#999" : "#111",
        color: "#fff",
        cursor: rows.length === 0 ? "not-allowed" : "pointer",
        fontWeight: 700,
      }}
    >
      CSV İndir
    </button>
  );
}