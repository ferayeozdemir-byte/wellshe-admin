"use client";

import { deleteAsset } from "./actions";

export default function DeleteAssetForm({
  id,
  bucket,
  path,
}: {
  id: string;
  bucket: string;
  path: string;
}) {
  return (
    <form
      action={deleteAsset}
      onSubmit={(e) => {
        const ok = window.confirm("Bu dosya silinsin mi? Bu işlem geri alınamaz.");
        if (!ok) e.preventDefault();
      }}
      style={{ marginTop: 10 }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="bucket" value={bucket} />
      <input type="hidden" name="path" value={path} />

      <button
        type="submit"
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #ddd",
          cursor: "pointer",
          fontWeight: 800,
          background: "#fff",
        }}
      >
        Sil
      </button>
    </form>
  );
}
