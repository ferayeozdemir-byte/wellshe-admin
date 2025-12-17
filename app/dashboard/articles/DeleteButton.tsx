// app/dashboard/articles/DeleteButton.tsx
"use client";

import { deleteArticle } from "./actions";

export default function DeleteButton({ id }: { id: string }) {
  return (
    <form
      action={deleteArticle}
      onSubmit={(e) => {
        if (!confirm("Bu içeriği silmek istediğinize emin misiniz?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" style={btnDanger}>
        Delete
      </button>
    </form>
  );
}

const btnDanger: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e33",
  background: "#fff",
  color: "#e33",
  cursor: "pointer",
  fontWeight: 700,
};
