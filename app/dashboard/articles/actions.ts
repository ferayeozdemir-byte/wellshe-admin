// app/dashboard/articles/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

export async function createArticle() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: article, error: articleErr } = await supabase
    .from("articles")
    .insert({ status: "draft" })
    .select("id")
    .single();

  if (articleErr || !article) {
    throw new Error(articleErr?.message || "Article oluşturulamadı");
  }

  const { error: trErr } = await supabase.from("article_translations").insert({
    article_id: article.id,
    lang: "tr",
    title: "",
    summary: "",
    content_html: "",
    slug: "",
    seo_title: "",
    seo_description: "",
  });

  if (trErr) {
    await supabase.from("articles").delete().eq("id", article.id);
    throw new Error(trErr.message);
  }

  revalidatePath("/dashboard/articles");
  redirect(`/dashboard/articles/${article.id}/edit`);
}

export async function deleteArticle(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("ID eksik");

  const supabase = await createClient();

  const { error: delTrErr } = await supabase
    .from("article_translations")
    .delete()
    .eq("article_id", id);

  if (delTrErr) throw new Error(delTrErr.message);

  const { error: delErr } = await supabase.from("articles").delete().eq("id", id);
  if (delErr) throw new Error(delErr.message);

  revalidatePath("/dashboard/articles");
}
