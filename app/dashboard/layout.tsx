import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin(); // sadece admin
  return <>{children}</>;
}
