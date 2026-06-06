"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";

type AnnouncementStatus = "draft" | "published" | "archived";

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNullableDate(formData: FormData, key: string) {
  const value = getText(formData, key);
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function getStatus(formData: FormData): AnnouncementStatus {
  const value = getText(formData, "status");

  if (value === "published" || value === "archived" || value === "draft") {
    return value;
  }

  return "draft";
}

function getPriority(formData: FormData) {
  const raw = getText(formData, "priority");
  const value = Number.parseInt(raw, 10);

  if (!Number.isFinite(value)) return 0;
  return value;
}

export async function createAnnouncement(formData: FormData) {
  const { supabase } = await requireAdmin(["admin", "editor"]);

  const title = getText(formData, "title");
  const body = getText(formData, "body");
  const status = getStatus(formData);
  const priority = getPriority(formData);
  const starts_at = getNullableDate(formData, "starts_at");
  const ends_at = getNullableDate(formData, "ends_at");

  if (!title || !body) {
    throw new Error("Başlık ve duyuru metni zorunlu.");
  }

  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    status,
    priority,
    starts_at,
    ends_at,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/announcements");
}

export async function updateAnnouncement(formData: FormData) {
  const { supabase } = await requireAdmin(["admin", "editor"]);

  const id = getText(formData, "id");
  const title = getText(formData, "title");
  const body = getText(formData, "body");
  const status = getStatus(formData);
  const priority = getPriority(formData);
  const starts_at = getNullableDate(formData, "starts_at");
  const ends_at = getNullableDate(formData, "ends_at");

  if (!id) {
    throw new Error("Duyuru id bulunamadı.");
  }

  if (!title || !body) {
    throw new Error("Başlık ve duyuru metni zorunlu.");
  }

  const { error } = await supabase
    .from("announcements")
    .update({
      title,
      body,
      status,
      priority,
      starts_at,
      ends_at,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/announcements");
}

export async function deleteAnnouncement(formData: FormData) {
  const { supabase } = await requireAdmin(["admin", "editor"]);

  const id = getText(formData, "id");

  if (!id) {
    throw new Error("Duyuru id bulunamadı.");
  }

  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/announcements");
}