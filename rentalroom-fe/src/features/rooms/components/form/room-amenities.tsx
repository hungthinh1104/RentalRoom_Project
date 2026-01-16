"use client";

import { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RoomInput } from "../../schemas";
import { AmenityType } from "@/types/enums";
import { Wifi, Wind, Snowflake, BedDouble, Refrigerator } from "lucide-react";

interface RoomAmenitiesProps {
    form: UseFormReturn<RoomInput>;
}

const AMENITY_CONFIG: Record<AmenityType, { label: string; icon: React.ReactNode }> = {
    [AmenityType.WIFI]: { label: "Wifi", icon: <Wifi className="w-4 h-4" /> },
    [AmenityType.AC]: { label: "Điều hòa", icon: <Snowflake className="w-4 h-4" /> },
    [AmenityType.FRIDGE]: { label: "Tủ lạnh", icon: <Refrigerator className="w-4 h-4" /> },
    [AmenityType.BED]: { label: "Giường", icon: <BedDouble className="w-4 h-4" /> },
    [AmenityType.WASHER]: { label: "Máy giặt", icon: <Wind className="w-4 h-4" /> },
};

export function RoomAmenities({ form }: RoomAmenitiesProps) {
    const { watch, setValue } = form;
    const currentAmenities = watch("amenities") as string[] | undefined;

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Tiện nghi</CardTitle>
                <CardDescription>Các tiện ích có sẵn trong phòng</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(AMENITY_CONFIG).map(([type, config]) => (
                        <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                                id={`amenity-${type}`}
                                checked={currentAmenities?.includes(type as AmenityType) || false}
                                onCheckedChange={(checked) => {
                                    const current = currentAmenities || [];
                                    let newAmenities;
                                    if (checked) {
                                        newAmenities = [...current, type];
                                    } else {
                                        newAmenities = current.filter((t: string) => t !== type);
                                    }
                                    setValue("amenities", newAmenities as AmenityType[], { shouldDirty: true });
                                }}
                            />
                            <Label
                                htmlFor={`amenity-${type}`}
                                className="flex items-center gap-2 cursor-pointer font-normal"
                            >
                                {config.icon}
                                {config.label}
                            </Label>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
