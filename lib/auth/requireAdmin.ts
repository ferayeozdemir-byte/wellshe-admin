// lib/auth/requireAdmin.ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AllowedRole = "admin" | "editor";

export async function requireAdmin(allowedRoles: AllowedRole[] = ["admin"]) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) redirect("/login");

  const role = profile.role as AllowedRole | null;

  if (!role || !allowedRoles.includes(role)) {
    redirect("/login");
  }

  return { supabase, user, role };
}
