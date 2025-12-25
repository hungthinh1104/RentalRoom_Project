import { Check } from "lucide-react";
import { RoomAmenity } from "@/types";
import { AmenityType } from "@/types/enums";

interface RoomAmenitiesProps {
  amenities?: RoomAmenity[];
}

export function RoomAmenities({ amenities = [] }: RoomAmenitiesProps) {
  if (amenities.length === 0) {
    return <p className="text-muted-foreground text-sm">Chưa có tiện ích nào.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {amenities.map((amenity) => (
        <div key={amenity.id} className="flex items-center gap-2 text-sm">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-3 w-3" />
          </div>
          <span>{formatAmenityType(amenity.amenityType)}</span>
        </div>
      ))}
    </div>
  );
}

function formatAmenityType(type: AmenityType): string {
  const amenityMap: Record<AmenityType, string> = {
    [AmenityType.AC]: "Điều hòa",
    [AmenityType.FRIDGE]: "Tủ lạnh",
    [AmenityType.WASHER]: "Máy giặt",
    [AmenityType.BED]: "Giường",
    [AmenityType.WIFI]: "WiFi",
  };
  return amenityMap[type] || type;
}
