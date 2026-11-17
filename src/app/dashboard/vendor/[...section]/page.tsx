import DashboardSectionPage from "@/components/dashboard/dashboard-section-page";

export default async function VendorSectionPage({
  params,
}: PageProps<"/dashboard/vendor/[...section]">) {
  const { section } = await params;
  return <DashboardSectionPage role="vendor" section={section.join("/")} />;
}
