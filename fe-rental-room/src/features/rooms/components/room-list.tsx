import { memo } from "react";
import { Room } from "@/types";
import { RoomCard } from "./room-card";

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
            className="h-[560px] rounded-[20px] bg-muted animate-pulse"
            aria-label={`Loading room ${i + 1}`}
          />
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
