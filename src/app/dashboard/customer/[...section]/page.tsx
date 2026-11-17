import DashboardSectionPage from "@/components/dashboard/dashboard-section-page";

export default async function CustomerSectionPage({
  params,
}: PageProps<"/dashboard/customer/[...section]">) {
  const { section } = await params;
  return <DashboardSectionPage role="customer" section={section.join("/")} />;
}
