import HomePage from "@/components/home/home-page";
import {
  demoWeddingServices,
  type WeddingService,
} from "@/lib/homepage-data";

export default function Home() {
  const featuredServices = demoWeddingServices.filter(
    (service: WeddingService) =>
      service.approvalStatus === "approved" && service.isActive,
  );

  return <HomePage services={featuredServices} />;
}
