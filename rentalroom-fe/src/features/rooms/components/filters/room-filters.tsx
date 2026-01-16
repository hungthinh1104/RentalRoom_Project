"use client";

import { useState, useCallback, useMemo } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RoomPriceFilter,
  RoomStatusFilter,
  RoomSizeFilter,
} from "./room-filter-controls";
import { RoomStatus } from "@/types/enums";
import { RoomSort } from "../room-sort";
import { RoomAmenitiesFilter } from "../room-amenities-filter";
import { type RoomFilterInput } from "../../schemas";

interface RoomFiltersProps {
  onFiltersChange: (filters: RoomFilterInput) => void;
  isLoading?: boolean;
}

export function RoomFilters({ onFiltersChange, isLoading = false }: RoomFiltersProps) {
  const [filters, setFilters] = useState<RoomFilterInput>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMinPriceChange = useCallback((value: number | undefined) => {
    setFilters((prev) => ({ ...prev, minPrice: value }));
  }, []);

  const handleMaxPriceChange = useCallback((value: number | undefined) => {
    setFilters((prev) => ({ ...prev, maxPrice: value }));
  }, []);

  const handleMinAreaChange = useCallback((value: number | undefined) => {
    setFilters((prev) => ({ ...prev, minArea: value }));
  }, []);

  const handleMaxAreaChange = useCallback((value: number | undefined) => {
    setFilters((prev) => ({ ...prev, maxArea: value }));
  }, []);

  const handleStatusChange = useCallback((value: RoomStatus | undefined) => {
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  const handleSortByChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: value as "price" | "area" | "newest" | "rating",
    }));
  }, []);

  const handleSortOrderChange = useCallback((value: "asc" | "desc") => {
    setFilters((prev) => ({ ...prev, sortOrder: value }));
  }, []);

  const handleAmenitiesChange = useCallback((amenities: string[]) => {
    setFilters((prev) => ({
      ...prev,
      amenities: amenities.length > 0 ? amenities : undefined,
    }));
  }, []);

  const handleApply = useCallback(() => {
    const cleanFilters: Partial<RoomFilterInput> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0)) {
        const k = key as keyof RoomFilterInput;
        (cleanFilters as Partial<Record<keyof RoomFilterInput, unknown>>)[k] = value as unknown;
      }
    });
    onFiltersChange(cleanFilters as RoomFilterInput);
    setIsExpanded(false);
  }, [filters, onFiltersChange]);

  const handleReset = useCallback(() => {
    setFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => v !== undefined && v !== null && v !== "" && (!Array.isArray(v) || v.length > 0)),
    [filters]
  );

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((v) => v !== undefined && v !== null && v !== "" && (!Array.isArray(v) || v.length > 0)).length;
  }, [filters]);

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </Button>

          {/* Quick Sort */}
          <div className="flex items-center gap-2">
            <RoomSort
              sortBy={filters.sortBy || "newest"}
              sortOrder={filters.sortOrder || "desc"}
              onSortByChange={handleSortByChange}
              onSortOrderChange={handleSortOrderChange}
              compact
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Expandable Filter Panel */}
      {isExpanded && (
        <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Compact Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <RoomStatusFilter
              status={filters.status}
              onChange={handleStatusChange}
            />
            <RoomPriceFilter
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              onMinPriceChange={handleMinPriceChange}
              onMaxPriceChange={handleMaxPriceChange}
            />
            <RoomSizeFilter
              minArea={filters.minArea}
              maxArea={filters.maxArea}
              onMinAreaChange={handleMinAreaChange}
              onMaxAreaChange={handleMaxAreaChange}
            />
          </div>

          {/* Amenities */}
          <div className="border-t border-border/50 pt-3">
            <RoomAmenitiesFilter
              selectedAmenities={filters.amenities || []}
              onAmenitiesChange={handleAmenitiesChange}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              Đóng
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={isLoading}
            >
              Áp dụng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
