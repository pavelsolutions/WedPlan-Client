import DashboardSectionPage from "@/components/dashboard/dashboard-section-page";

export default async function AdminSectionPage({
  params,
}: PageProps<"/dashboard/admin/[...section]">) {
  const { section } = await params;
  return <DashboardSectionPage role="admin" section={section.join("/")} />;
}
