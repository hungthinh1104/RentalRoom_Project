'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Wifi, Wind, Refrigerator, WashingMachine, BedDouble } from 'lucide-react';
import { AmenityType } from '@/types/enums';

const AMENITY_OPTIONS = [
  { id: AmenityType.AC, label: 'Điều hòa', icon: Wind },
  { id: AmenityType.FRIDGE, label: 'Tủ lạnh', icon: Refrigerator },
  { id: AmenityType.WASHER, label: 'Máy giặt', icon: WashingMachine },
  { id: AmenityType.BED, label: 'Giường', icon: BedDouble },
  { id: AmenityType.WIFI, label: 'WiFi', icon: Wifi },
];

interface RoomAmenitiesFilterProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
}

export function RoomAmenitiesFilter({
  selectedAmenities,
  onAmenitiesChange,
}: RoomAmenitiesFilterProps) {
  const handleAmenityToggle = (amenityId: string) => {
    const updated = selectedAmenities.includes(amenityId)
      ? selectedAmenities.filter((id) => id !== amenityId)
      : [...selectedAmenities, amenityId];
    onAmenitiesChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Tiện ích</Label>
      <div className="grid grid-cols-2 gap-3">
        {AMENITY_OPTIONS.map((amenity) => {
          const Icon = amenity.icon;
          const isSelected = selectedAmenities.includes(amenity.id);

          return (
            <div key={amenity.id} className="flex items-center space-x-2">
              <Checkbox
                id={`amenity-${amenity.id}`}
                checked={isSelected}
                onCheckedChange={() => handleAmenityToggle(amenity.id)}
                className="cursor-pointer"
              />
              <label
                htmlFor={`amenity-${amenity.id}`}
                className="flex items-center gap-2 cursor-pointer text-sm flex-1"
              >
                <Icon className={`size-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{amenity.label}</span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
