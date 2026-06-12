"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";

type AnnouncementStatus = "draft" | "published" | "archived";

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

const ISTANBUL_UTC_OFFSET = "+03:00";

function getNullableDate(formData: FormData, key: string) {
  const value = getText(formData, key);
  if (!value) return null;

  // datetime-local bize timezone olmadan gelir: 2026-06-12T17:48
  // Admin panelde girilen saati Türkiye saati kabul edip UTC olarak DB'ye kaydediyoruz.
  const normalizedValue = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalizedValue}${ISTANBUL_UTC_OFFSET}`);

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