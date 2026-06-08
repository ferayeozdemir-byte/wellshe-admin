"use client";

import { useTransition } from "react";
import { deleteAnnouncement } from "./actions";

type DeleteAnnouncementFormProps = {
  id: string;
  title: string;
};

export default function DeleteAnnouncementForm({
  id,
  title,
}: DeleteAnnouncementFormProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        const ok = window.confirm(
          `"${title}" duyurusunu silmek istediğine emin misin?\n\nBu işlem geri alınamaz.`
        );

        if (!ok) return;

        startTransition(() => {
          void deleteAnnouncement(formData);
        });
      }}
      style={{ marginTop: 10 }}
    >
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid #f1b5b5",
          background: "#fff5f5",
          color: "#9f1239",
          fontWeight: 800,
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? "Siliniyor..." : "Sil"}
      </button>
    </form>
  );
}