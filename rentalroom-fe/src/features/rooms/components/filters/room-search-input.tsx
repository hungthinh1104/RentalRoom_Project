"use client";

import { useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RoomSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RoomSearchInput({
  value,
  onChange,
  placeholder = "Tìm phòng theo số phòng, tên tài sản hoặc vị trí...",
}: RoomSearchInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="room-search">Tìm kiếm</Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id="room-search"
          placeholder={placeholder}
          className="pl-9"
          value={value}
          onChange={handleChange}
          aria-label="Tìm kiếm phòng"
        />
      </div>
    </div>
  );
}
