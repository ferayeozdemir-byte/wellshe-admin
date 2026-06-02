"use client";

import { deleteAsset } from "./actions";

export default function DeleteAssetForm({
  id,
  bucket,
  path,
  storageProvider,
}: {
  id: string;
  bucket: string;
  path: string;
  storageProvider?: string | null;
}) {
  return (
    <form
      action={deleteAsset}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Bu dosya kalıcı olarak silinecek:\n\n${path}\n\nBu işlem geri alınamaz. Devam etmek istiyor musun?`
        );

        if (!ok) e.preventDefault();
      }}
      style={{ marginTop: 0 }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="bucket" value={bucket} />
      <input type="hidden" name="path" value={path} />
      <input
        type="hidden"
        name="storage_provider"
        value={storageProvider ?? ""}
      />

      <button
        type="submit"
        style={{
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid #f3b3b3",
          cursor: "pointer",
          fontWeight: 800,
          background: "#fff",
          color: "crimson",
          fontSize: 12,
        }}
      >
        Sil
      </button>
    </form>
  );
}