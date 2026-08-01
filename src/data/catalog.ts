/**
 * ── PRODUCT DATA ENGINE ────────────────────────────────────────────────
 * Rigidly decoupled from all UI rendering logic. Components consume these
 * structured metadata objects only — no hard-coded product copy in views.
 */
import fabricImg from "@/assets/product-fabric.jpg";
import bubuImg from "@/assets/product-bubu.jpg";
import palazzoImg from "@/assets/product-palazzo.jpg";
import asoebiImg from "@/assets/product-asoebi.jpg";
import fabricMacro from "@/assets/detail-fabric-macro.jpg";
import fabricStack from "@/assets/detail-fabric-stack.jpg";
import bubuMacro from "@/assets/detail-bubu-macro.jpg";
import bubuFull from "@/assets/detail-bubu-full.jpg";
import palazzoMacro from "@/assets/detail-palazzo-macro.jpg";
import palazzoStyled from "@/assets/detail-palazzo-styled.jpg";
import asoebiMacro from "@/assets/detail-asoebi-macro.jpg";
import asoebiBulk from "@/assets/detail-asoebi-bulk.jpg";

export type Category = "Fabrics" | "Ready-to-Wear" | "Asoebi";
export type StockStatus = "In Stock" | "Limited Stock" | "Inquire for Timeline";

export interface Product {
  id: string;
  name: string;
  category: Category;
  variant: string;
  base_price: number;
  stock_status: StockStatus;
  description: string;
  /** Presentation metadata layered on top of the canonical schema. */
  image: string;
  /** Quick-view gallery frames — first is the card image. */
  gallery: { src: string; caption: string }[];
  pattern: string;
  options: string[];
  optionLabel: string;
  minQty: number;
  /** Volume pricing rules — Asoebi bulk merchandising. */
  volumeTiers?: { minQty: number; unitPrice: number; label: string }[];
}

export const BRAND = {
  handle: "3kbelowankara",
  currency: "NGN",
  whatsapp: "2348000000000",
  instagram: "https://www.instagram.com/3kbelowankara",
} as const;

export const CATEGORIES: { key: Category | "All"; label: string; blurb: string }[] = [
  { key: "All", label: "All Pieces", blurb: "The complete house selection" },
  { key: "Fabrics", label: "3-Yard Cotton Ankara", blurb: "100% cotton wax print bundles" },
  { key: "Ready-to-Wear", label: "Ready-To-Wear", blurb: "Bubu gowns & palazzo tailoring" },
  { key: "Asoebi", label: "Asoebi Bulk", blurb: "Volume pricing for events" },
];

export const PRODUCTS: Product[] = [
  {
    id: "ank-001",
    name: "Premium 100% Cotton Ankara",
    category: "Fabrics",
    variant: "3-Yard Bundle",
    base_price: 3000,
    stock_status: "In Stock",
    description:
      "Authentic, high-grade cotton weave featuring traditional vibrant print styling.",
    image: fabricImg,
    gallery: [
      { src: fabricImg, caption: "3-yard bundle as supplied" },
      { src: fabricMacro, caption: "Macro: wax-block print edges & cotton weave" },
      { src: fabricStack, caption: "Print family stack — indigo, ochre, emerald" },
    ],
    pattern: "Geometric Wax Block",
    optionLabel: "Print Family",
    options: ["Indigo Bloom", "Ochre Sun", "Emerald Tile", "Clay Mosaic"],
    minQty: 1,
  },
  {
    id: "rtw-002",
    name: "Elegance Bubu Gown",
    category: "Ready-to-Wear",
    variant: "Free Size",
    base_price: 12500,
    stock_status: "Limited Stock",
    description:
      "Flowing, sophisticated silhouette engineered for modern everyday luxury.",
    image: bubuImg,
    gallery: [
      { src: bubuImg, caption: "Bubu gown, house styling" },
      { src: bubuMacro, caption: "Macro: rosette medallion & hem stitch" },
      { src: bubuFull, caption: "Full-length drape on body" },
    ],
    pattern: "Rosette Medallion",
    optionLabel: "Fit",
    options: ["Free Size", "Plus (UK 18-22)", "Petite Length"],
    minQty: 1,
  },
  {
    id: "rtw-003",
    name: "Tailored Palazzo Trousers",
    category: "Ready-to-Wear",
    variant: "Adjustable Waist",
    base_price: 8500,
    stock_status: "In Stock",
    description:
      "Wide-leg cut with premium pattern alignment across all structural seams.",
    image: palazzoImg,
    gallery: [
      { src: palazzoImg, caption: "Palazzo trousers, flat styling" },
      { src: palazzoMacro, caption: "Macro: sunburst alignment across the seam" },
      { src: palazzoStyled, caption: "Styled in motion — wide-leg fall" },
    ],
    pattern: "Radial Sunburst",
    optionLabel: "Size",
    options: ["S", "M", "L", "XL"],
    minQty: 1,
  },
  {
    id: "aso-004",
    name: "Custom Asoebi Bulk Supply",
    category: "Asoebi",
    variant: "Minimum 10 Packs",
    base_price: 2800,
    stock_status: "Inquire for Timeline",
    description:
      "High-volume fabric pairing and coordination tailored for traditional event sizing.",
    image: asoebiImg,
    gallery: [
      { src: asoebiImg, caption: "Asoebi coordination sample" },
      { src: asoebiMacro, caption: "Macro: two-tone leaf damask pairing" },
      { src: asoebiBulk, caption: "Bulk packs prepared for an event" },
    ],
    pattern: "Coordinated Leaf Damask",
    optionLabel: "Coordination",
    options: ["Single Print", "Two-Tone Pairing", "Bride + Party Split"],
    minQty: 10,
    volumeTiers: [
      { minQty: 10, unitPrice: 2800, label: "10 – 24 packs" },
      { minQty: 25, unitPrice: 2650, label: "25 – 49 packs" },
      { minQty: 50, unitPrice: 2450, label: "50+ packs" },
    ],
  },
];

/** Deterministic unit price resolution, including volume tier rules. */
export function unitPriceFor(product: Product, qty: number): number {
  if (!product.volumeTiers) return product.base_price;
  return product.volumeTiers.reduce(
    (price, tier) => (qty >= tier.minQty ? tier.unitPrice : price),
    product.base_price,
  );
}

export function formatNGN(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: BRAND.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** SKU definition: product id + option token, stable and human readable. */
export function buildSku(product: Product, option: string): string {
  return `${product.id.toUpperCase()}-${option
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 6)
    .toUpperCase()}`;
}