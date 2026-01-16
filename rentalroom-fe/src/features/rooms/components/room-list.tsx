import { memo } from "react";
import { Room } from "@/types";
import { RoomCard } from "./room-card";
import { Skeleton } from "@/components/ui/skeleton";

interface RoomListProps {
  rooms: Room[];
  isLoading?: boolean;
}

export const RoomList = memo(function RoomList({ rooms, isLoading }: RoomListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-[28px] bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden"
            aria-label={`Đang tải phòng ${i + 1}`}
          >
            <div className="h-72 w-full">
              <Skeleton className="h-72 w-full" />
            </div>
            <div className="p-5">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg mb-2">Không tìm thấy phòng trọ phù hợp.</p>
        <p className="text-sm text-muted-foreground">
          Hãy thử điều chỉnh các bộ lọc hoặc xem toàn bộ phòng có sẵn.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
});
