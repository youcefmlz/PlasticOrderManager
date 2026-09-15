import { Product } from "@/contexts/CartContext";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Industrial Storage Container",
    category: "Containers",
    price: 45.99,
    description:
      "Heavy-duty plastic storage container designed for industrial use. Features reinforced corners and stackable design.",
    image: require("@/assets/images/icon.png"),
    specifications: [
      "Capacity: 50L",
      "Material: HDPE",
      "Stackable",
      "UV Resistant",
    ],
  },
  {
    id: "2",
    name: "Plastic Pallets Set",
    category: "Pallets",
    price: 125.5,
    description:
      "Durable plastic pallets suitable for warehouse and shipping applications. Set of 4 pallets.",
    image: require("@/assets/images/icon.png"),
    specifications: [
      "Load capacity: 2000 lbs",
      "Material: Recycled PP",
      "Dimensions: 48x40 inches",
    ],
  },
  {
    id: "3",
    name: "Food Grade Buckets",
    category: "Containers",
    price: 18.75,
    description:
      "FDA-approved food-grade plastic buckets with secure lids. Perfect for food storage and transport.",
    image: require("@/assets/images/icon.png"),
    specifications: [
      "Capacity: 5 gallons",
      "FDA approved",
      "Air-tight seal",
      "BPA-free",
    ],
  },
  {
    id: "4",
    name: "Plastic Utility Bins",
    category: "Bins",
    price: 32.0,
    description:
      "Multi-purpose utility bins for warehouse organization. Featuring integrated handles.",
    image: require("@/assets/images/icon.png"),
    specifications: [
      "Dimensions: 16x12x8 inches",
      "Stackable",
      "Color-coded options",
    ],
  },
  {
    id: "5",
    name: "Heavy-Duty Crates",
    category: "Crates",
    price: 89.99,
    description:
      "Industrial-strength crates for heavy items. Collapsible design for easy storage.",
    image: require("@/assets/images/icon.png"),
    specifications: [
      "Load capacity: 150 lbs",
      "Collapsible",
      "Ventilated design",
    ],
  },
  {
    id: "6",
    name: "Plastic Totes",
    category: "Totes",
    price: 24.5,
    description:
      "Versatile plastic totes with snap-on lids. Ideal for parts storage and organization.",
    image: require("@/assets/images/icon.png"),
    specifications: ["Capacity: 27 quarts", "Clear design", "Snap-on lid"],
  },
];

export const CATEGORIES = [
  "All",
  "Containers",
  "Pallets",
  "Bins",
  "Crates",
  "Totes",
];
