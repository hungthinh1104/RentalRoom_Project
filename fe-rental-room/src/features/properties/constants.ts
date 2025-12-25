import { PropertyType } from "@/types/enums";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: "Apartment",
  [PropertyType.HOUSE]: "House",
  [PropertyType.STUDIO]: "Studio",
};

export const PROPERTY_TYPE_ICONS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: "🏢",
  [PropertyType.HOUSE]: "🏠",
  [PropertyType.STUDIO]: "🏘️",
};
