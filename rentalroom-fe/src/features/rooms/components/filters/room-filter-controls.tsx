"use client";

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomStatus } from "@/types/enums";

interface RoomPriceFilterProps {
  minPrice?: number;
  maxPrice?: number;
  onMinPriceChange: (value: number | undefined) => void;
  onMaxPriceChange: (value: number | undefined) => void;
}

export function RoomPriceFilter({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: RoomPriceFilterProps) {
  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value ? Number(e.target.value) : undefined;
      onMinPriceChange(value);
    },
    [onMinPriceChange]
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value ? Number(e.target.value) : undefined;
      onMaxPriceChange(value);
    },
    [onMaxPriceChange]
  );

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="min-price">Giá tối thiểu (đ)</Label>
        <Input
          id="min-price"
          type="number"
          placeholder="0"
          value={minPrice || ""}
          onChange={handleMinChange}
          min="0"
          aria-label="Bộ lọc giá tối thiểu"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="max-price">Giá tối đa (đ)</Label>
        <Input
          id="max-price"
          type="number"
          placeholder="∞"
          value={maxPrice || ""}
          onChange={handleMaxChange}
          min="0"
          aria-label="Bộ lọc giá tối đa"
        />
      </div>
    </>
  );
}

interface RoomStatusFilterProps {
  status?: RoomStatus;
  onChange: (status: RoomStatus | undefined) => void;
}

export function RoomStatusFilter({
  status,
  onChange,
}: RoomStatusFilterProps) {
  const handleChange = useCallback(
    (value: string) => {
      // 'ALL' represents no filter
      onChange(value === 'ALL' ? undefined : (value as RoomStatus));
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="status">Trạng thái</Label>
      <Select value={status ?? "ALL"} onValueChange={handleChange}>
        <SelectTrigger id="status" aria-label="Bộ lọc trạng thái phòng">
          <SelectValue placeholder="Tất cả trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
          {Object.values(RoomStatus).map((s) => (
            <SelectItem key={s} value={s}>
              {s === 'AVAILABLE' ? 'Có sẵn' : s === 'OCCUPIED' ? 'Đã cho thuê' : s === 'UNAVAILABLE' ? 'Bảo trì' : s === 'DEPOSIT_PENDING' ? 'Đã đặt cọc' : s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface RoomSizeFilterProps {
  minArea?: number;
  maxArea?: number;
  onMinAreaChange: (value: number | undefined) => void;
  onMaxAreaChange: (value: number | undefined) => void;
}

export function RoomSizeFilter({
  minArea,
  maxArea,
  onMinAreaChange,
  onMaxAreaChange,
}: RoomSizeFilterProps) {
  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value ? Number(e.target.value) : undefined;
      onMinAreaChange(value);
    },
    [onMinAreaChange]
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value ? Number(e.target.value) : undefined;
      onMaxAreaChange(value);
    },
    [onMaxAreaChange]
  );

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="min-area">Diện tích tối thiểu (m²)</Label>
        <Input
          id="min-area"
          type="number"
          placeholder="0"
          value={minArea || ""}
          onChange={handleMinChange}
          min="0"
          step="0.1"
          aria-label="Bộ lọc diện tích tối thiểu"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="max-area">Diện tích tối đa (m²)</Label>
        <Input
          id="max-area"
          type="number"
          placeholder="∞"
          value={maxArea || ""}
          onChange={handleMaxChange}
          min="0"
          step="0.1"
          aria-label="Bộ lọc diện tích tối đa"
        />
      </div>
    </>
  );
}
