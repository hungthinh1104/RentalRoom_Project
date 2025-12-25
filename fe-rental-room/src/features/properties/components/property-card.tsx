import Link from "next/link";
import { Building2, MapPin, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Property } from "@/types";
import { PropertyType, RoomStatus } from "@/types/enums";
import { PROPERTY_TYPE_LABELS } from "../constants";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const totalRooms = property.totalRooms || property.rooms?.length || 0;
  const occupiedRooms = property.rooms?.filter(r => r.status === RoomStatus.OCCUPIED).length || 0;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const getPropertyIcon = (type: PropertyType) => {
    switch (type) {
      case PropertyType.APARTMENT:
        return <Building2 className="size-5" />;
      case PropertyType.HOUSE:
        return <Home className="size-5" />;
      case PropertyType.STUDIO:
        return <Building2 className="size-5" />;
      default:
        return <Building2 className="size-5" />;
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full group hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300">
      <CardContent className="px-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {getPropertyIcon(property.propertyType)}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{property.name}</h3>
              <p className="text-sm text-muted-foreground">
                {PROPERTY_TYPE_LABELS[property.propertyType]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{occupancyRate}%</p>
            <p className="text-xs text-muted-foreground">Occupancy</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 mt-0.5 shrink-0" />
            <p className="line-clamp-2">{property.address}, {property.district}, {property.city}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Total Rooms</p>
              <p className="font-medium">{totalRooms}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Occupied</p>
              <p className="font-medium">{occupiedRooms}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <Button asChild className="w-full" variant="outline">
            <Link href={`/properties/${property.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
