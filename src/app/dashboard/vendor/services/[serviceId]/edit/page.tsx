import VendorServiceEditor from "@/components/dashboard/vendor-service-editor";

export default async function VendorEditServicePage({
  params,
}: PageProps<"/dashboard/vendor/services/[serviceId]/edit">) {
  const { serviceId } = await params;
  return <VendorServiceEditor serviceId={serviceId} />;
}
