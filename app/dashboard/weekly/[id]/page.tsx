import { redirect } from "next/navigation";

export default function WeeklyIdPage({ params }: { params: { id?: string } }) {
  const id = params?.id;
  if (!id) redirect("/dashboard/weekly");
  redirect(`/dashboard/weekly/${id}/edit`);
}
