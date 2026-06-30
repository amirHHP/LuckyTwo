export const CAFE_ZONES = ["NORTH", "CENTER", "WEST", "EAST"] as const;

export type CafeZone = (typeof CAFE_ZONES)[number];

export const ZONE_LABELS: Record<CafeZone, string> = {
  NORTH: "شمال تهران",
  CENTER: "مرکز تهران",
  WEST: "غرب تهران",
  EAST: "شرق تهران",
};

export const SUGGESTED_FEATURES = [
  "وای‌فای رایگان",
  "پارکینگ",
  "فضای باز",
  "محیط آرام",
  "مناسب قرار ملاقات",
  "موسیقی زنده",
  "دسر و کیک",
  "قهوه تخصصی",
  "بدون سیگار",
  "دسترسی آسان مترو",
];

export interface CafeInput {
  name: string;
  zone: string;
  address: string;
  lat: number;
  lng: number;
  description?: string | null;
  features?: string[];
  isVerified?: boolean;
}

export function parseFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function validateCafeInput(body: Partial<CafeInput>): { ok: true; data: CafeInput } | { ok: false; error: string } {
  const name = body.name?.trim();
  const zone = body.zone?.trim();
  const address = body.address?.trim();
  const lat = body.lat;
  const lng = body.lng;

  if (!name) return { ok: false, error: "نام کافه الزامی است" };
  if (!zone || !CAFE_ZONES.includes(zone as CafeZone)) {
    return { ok: false, error: "منطقه نامعتبر است" };
  }
  if (!address) return { ok: false, error: "آدرس الزامی است" };
  if (typeof lat !== "number" || Number.isNaN(lat)) {
    return { ok: false, error: "عرض جغرافیایی نامعتبر است" };
  }
  if (typeof lng !== "number" || Number.isNaN(lng)) {
    return { ok: false, error: "طول جغرافیایی نامعتبر است" };
  }

  const description = body.description?.trim() || null;
  const features = parseFeatures(body.features);
  const isVerified = body.isVerified !== false;

  return {
    ok: true,
    data: { name, zone, address, lat, lng, description, features, isVerified },
  };
}

export function serializeCafe(cafe: {
  id: string;
  name: string;
  zone: string;
  address: string;
  lat: number;
  lng: number;
  description: string | null;
  features: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...cafe,
    features: parseFeatures(cafe.features),
  };
}
