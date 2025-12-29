import Link from "next/link";
import { Building2, MapPin, Home, Zap, AlertCircle, CheckCircle2, DoorOpen, Edit2, Trash2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Property, Room } from "@/types";
import { PropertyType, RoomStatus } from "@/types/enums";
import { PROPERTY_TYPE_LABELS } from "../constants";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PropertyCardProps {
  property: Property;
  isLandlordView?: boolean;
  viewMode?: 'grid' | 'list';
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  isLoading?: boolean;
}

export function PropertyCard({ property, isLandlordView = false, viewMode = 'grid', onEdit, onDelete }: PropertyCardProps) {
  const totalRooms = property.totalRooms || property.rooms?.length || 0;
  const availableRooms = property.rooms?.filter((r: Room) => r.status === RoomStatus.AVAILABLE).length || 0;
  const occupiedRooms = property.rooms?.filter((r: Room) => r.status === RoomStatus.OCCUPIED).length || 0;
  const maintenanceRooms = property.rooms?.filter((r: Room) => r.status === RoomStatus.MAINTENANCE).length || 0;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const avgPrice = property.rooms && property.rooms.length > 0
    ? Math.round(property.rooms.reduce((sum: number, r: Room) => sum + Number(r.pricePerMonth), 0) / property.rooms.length)
    : 0;

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

  // const statusConfig: Record<RoomStatus, { color: string; label: string }> = {
  //   [RoomStatus.AVAILABLE]: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Trống" },
  //   [RoomStatus.OCCUPIED]: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Đã thuê" },
  //   [RoomStatus.MAINTENANCE]: { color: "bg-orange-500/10 text-orange-600 border-orange-500/20", label: "Bảo trì" },
  //   [RoomStatus.RESERVED]: { color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Đặt trước" },
  // };

  if (viewMode === 'list') {
    return (
      <Card className="group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Icon & Name */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                {getPropertyIcon(property.propertyType)}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-xl group-hover:text-primary transition-colors truncate">
                  {property.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="size-3.5" />
                  <span className="truncate">{property.address}, {property.ward}</span>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-shrink-0 w-full sm:w-auto">
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phòng</p>
                <p className="text-lg font-bold">{occupiedRooms}/{totalRooms}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tỷ lệ</p>
                <p className="text-lg font-bold text-primary">{occupancyRate}%</p>
              </div>
              <div className="text-center sm:text-left hidden sm:block">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Giá TB</p>
                <p className="text-lg font-bold">
                  {new Intl.NumberFormat('vi-VN').format(Math.round(avgPrice / 100000) / 10)}tr
                </p>
              </div>
            </div>

            {/* List Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
              <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none h-10 px-4 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all">
                <Link href={`/dashboard/landlord/properties/${property.id}/rooms`}>
                  Quản lý
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" asChild>
                <Link href={`/dashboard/landlord/properties/${property.id}/edit`}>
                  <Edit2 className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden flex flex-col h-full border-border/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative bg-card">
      {/* Visual Identity Decorator */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="pb-4 space-y-4 pt-6 px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-primary/10">
              {getPropertyIcon(property.propertyType)}
            </div>
            <div className="min-w-0 flex-1">
              <Badge variant="outline" className="mb-2 bg-muted/50 text-[10px] h-5 uppercase tracking-wider font-bold border-border/50">
                {PROPERTY_TYPE_LABELS[property.propertyType]}
              </Badge>
              <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors duration-300">
                {property.name}
              </CardTitle>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="inline-flex flex-col items-end">
              <span className="text-2xl font-black text-foreground">{occupancyRate}%</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Lấp đầy</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground relative">
          <MapPin className="size-4 mt-0.5 flex-shrink-0 text-primary/70" />
          <p className="line-clamp-1 group-hover:line-clamp-none transition-all duration-300">
            {property.address}, {property.ward}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 space-y-6 pt-2 pb-6 px-6">
        {/* Occupancy Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-muted-foreground">Tình trạng thuê</span>
            <span className="text-foreground">{occupiedRooms}/{totalRooms} phòng</span>
          </div>
          <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.3)]"
              initial={{ width: 0 }}
              animate={{ width: `${occupancyRate}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Tổng phòng", value: totalRooms, icon: DoorOpen, color: "text-muted-foreground" },
            { label: "Phòng trống", value: availableRooms, icon: Zap, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Đã thuê", value: occupiedRooms, icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400" },
            { label: "Bảo trì", value: maintenanceRooms, icon: AlertCircle, color: "text-orange-600 dark:text-orange-400" }
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-transparent hover:border-border/50 hover:bg-muted/50 transition-all duration-300 group/stat">
              <stat.icon className={cn("size-4 flex-shrink-0 transition-transform group-hover/stat:scale-110", stat.color)} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{stat.label}</p>
                <p className="text-sm font-bold text-foreground leading-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Tóm tắt giá</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary">
              {new Intl.NumberFormat('vi-VN').format(Math.round(avgPrice / 1000) * 1000)}
            </span>
            <span className="text-xs font-bold text-muted-foreground">VND / tháng (TB)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-4 border-t border-border/50">
          <Button asChild className="flex-[2] h-11 rounded-xl font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95">
            <Link href={isLandlordView ? `/dashboard/landlord/properties/${property.id}/rooms` : `/properties/${property.id}`} className="flex items-center gap-2">
              {isLandlordView ? "Quản lý phòng" : "Xem chi tiết"}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>

          {isLandlordView && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-border/50 hover:bg-muted transition-all active:scale-95"
                onClick={() => onEdit?.(property)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-border/50 text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                onClick={() => onDelete?.(property)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
