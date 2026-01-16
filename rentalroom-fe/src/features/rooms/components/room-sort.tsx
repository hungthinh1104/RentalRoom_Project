'use client';

import { ArrowUpDown, TrendingUp, Clock, Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface RoomSortProps {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  compact?: boolean;
}

export function RoomSort({
  sortBy = 'newest',
  sortOrder = 'desc',
  onSortByChange,
  onSortOrderChange,
  compact = false,
}: RoomSortProps) {
  const sortOptions = [
    { value: 'newest', label: 'Mới nhất', icon: Clock },
    { value: 'price', label: 'Giá', icon: TrendingUp },
    { value: 'area', label: 'Diện tích', icon: ArrowUpDown },
    { value: 'rating', label: 'Đánh giá', icon: Star },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="size-4" />
                    {option.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
          className="h-9 w-9 p-0"
        >
          <ArrowUpDown className={`size-4 transition-transform ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'
            }`} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <Label htmlFor="sort-by" className="text-sm font-medium mb-2 block">
          Sắp xếp theo
        </Label>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger id="sort-by" className="h-10">
            <SelectValue placeholder="Chọn cách sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="size-4" />
                    {option.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
        className="mb-0.5"
      >
        <ArrowUpDown className={`size-4 transition-transform ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'
          }`} />
      </Button>
    </div>
  );
}
