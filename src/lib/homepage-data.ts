export const weddingCategories = [
  "Photography & Videography",
  "Wedding Venues",
  "Decoration & Florist",
  "Catering Services",
  "Makeup & Styling",
  "Wedding Fashion",
] as const;

export type WeddingCategory = (typeof weddingCategories)[number];

export type WeddingService = {
  id: string;
  name: string;
  category: WeddingCategory;
  description: string;
  image: string;
  imageAlt: string;
  location: string;
  startingPrice: number;
  rating: number;
  reviewCount: number;
  vendorName: string;
  approvalStatus: "pending" | "approved" | "rejected";
  isActive: boolean;
};

export const demoWeddingServices: WeddingService[] = [
  {
    id: "golden-hour-studio",
    name: "Golden Hour Studio",
    category: "Photography & Videography",
    description:
      "Honest, sun-soaked photographs that bring you right back to the feeling of the day.",
    image:
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=960&q=85",
    imageAlt: "Newlyweds sharing a quiet moment outdoors",
    location: "Brooklyn, NY",
    startingPrice: 2800,
    rating: 4.9,
    reviewCount: 124,
    vendorName: "Olivia Bennett",
    approvalStatus: "approved",
    isActive: true,
  },
  {
    id: "the-willow-estate",
    name: "The Willow Estate",
    category: "Wedding Venues",
    description:
      "A light-filled garden estate with a glasshouse, old trees, and room for your whole story.",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=960&q=85",
    imageAlt: "Elegant wedding reception venue dressed for dinner",
    location: "Hudson Valley, NY",
    startingPrice: 7200,
    rating: 4.8,
    reviewCount: 86,
    vendorName: "The Willow Estate",
    approvalStatus: "approved",
    isActive: true,
  },
  {
    id: "bloom-and-gather",
    name: "Bloom & Gather",
    category: "Decoration & Florist",
    description:
      "Seasonal, garden-inspired flowers and thoughtful little details, gathered just for you.",
    image:
      "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=960&q=85",
    imageAlt: "Romantic wedding table with fresh flowers and candles",
    location: "Queens, NY",
    startingPrice: 1450,
    rating: 5.0,
    reviewCount: 72,
    vendorName: "Sofia Rivera",
    approvalStatus: "approved",
    isActive: true,
  },
  {
    id: "little-olive-catering",
    name: "Little Olive Catering",
    category: "Catering Services",
    description:
      "A generous, seasonal menu made for lingering at the table and going back for seconds.",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=960&q=85",
    imageAlt: "Beautifully styled reception table ready for dinner",
    location: "Long Island, NY",
    startingPrice: 95,
    rating: 4.9,
    reviewCount: 98,
    vendorName: "Daniel Kim",
    approvalStatus: "approved",
    isActive: true,
  },
  {
    id: "soft-glow-beauty",
    name: "Soft Glow Beauty",
    category: "Makeup & Styling",
    description:
      "A calm, feel-like-yourself beauty morning with a team who knows every pin and curl.",
    image:
      "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=960&q=85",
    imageAlt: "Bride getting ready with her wedding party",
    location: "Manhattan, NY",
    startingPrice: 350,
    rating: 4.9,
    reviewCount: 64,
    vendorName: "Amara Cole",
    approvalStatus: "approved",
    isActive: true,
  },
  {
    id: "heirloom-atelier",
    name: "Heirloom Atelier",
    category: "Wedding Fashion",
    description:
      "Thoughtful tailoring and timeless silhouettes, made personal from the first fitting.",
    image:
      "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=960&q=85",
    imageAlt: "A classic wedding dress displayed in soft natural light",
    location: "Brooklyn, NY",
    startingPrice: 1800,
    rating: 4.8,
    reviewCount: 51,
    vendorName: "Grace Lee",
    approvalStatus: "approved",
    isActive: true,
  },
  {
    id: "ever-after-films",
    name: "Ever After Films",
    category: "Photography & Videography",
    description:
      "Cinematic wedding films full of the little glances, happy tears, and dance-floor joy.",
    image:
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=960&q=85",
    imageAlt: "A couple celebrating their wedding together",
    location: "Stamford, CT",
    startingPrice: 2400,
    rating: 4.9,
    reviewCount: 43,
    vendorName: "Ethan Brooks",
    approvalStatus: "approved",
    isActive: true,
  },
  {
    id: "wildflower-table",
    name: "The Wildflower Table",
    category: "Catering Services",
    description:
      "Warm hospitality and a farm-to-table menu designed around the way you love to gather.",
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=960&q=85",
    imageAlt: "Romantic outdoor wedding dinner beneath hanging lights",
    location: "Beacon, NY",
    startingPrice: 110,
    rating: 4.8,
    reviewCount: 37,
    vendorName: "Mia Thompson",
    approvalStatus: "approved",
    isActive: true,
  },
];
