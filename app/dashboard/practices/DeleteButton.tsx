"use client";

import { deletePractice } from "./actions";

export default function DeleteButton({ id }: { id: string }) {
  return (
    <form
      action={deletePractice}
      onSubmit={(e) => {
        const ok = window.confirm(
          "Bu pratiği silmek istediğine emin misin?"
        );
        if (!ok) e.preventDefault();
      }}
      style={{ margin: 0 }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid #e33",
          background: "#fff",
          color: "#e33",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Delete
      </button>
    </form>
  );
}