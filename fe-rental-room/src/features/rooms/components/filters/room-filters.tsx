"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomSearchInput } from "./room-search-input";
import {
  RoomPriceFilter,
  RoomStatusFilter,
  RoomSizeFilter,
} from "./room-filter-controls";
import { RoomFiltersActions } from "./room-filters-actions";
import { RoomSort } from "../room-sort";
import { RoomAmenitiesFilter } from "../room-amenities-filter";
import { type RoomFilterInput } from "../../schemas";

interface RoomFiltersProps {
  onFiltersChange: (filters: RoomFilterInput) => void;
  isLoading?: boolean;
}

export function RoomFilters({ onFiltersChange, isLoading = false }: RoomFiltersProps) {
  const [filters, setFilters] = useState<RoomFilterInput>({});

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
    }));
  }, []);

  const handleMinPriceChange = useCallback((value: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: value,
    }));
  }, []);

  const handleMaxPriceChange = useCallback((value: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      maxPrice: value,
    }));
  }, []);

  const handleMinAreaChange = useCallback((value: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      minArea: value,
    }));
  }, []);

  const handleMaxAreaChange = useCallback((value: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      maxArea: value,
    }));
  }, []);

  const handleStatusChange = useCallback((value: any) => {
    setFilters((prev) => ({
      ...prev,
      status: value,
    }));
  }, []);

  const handleSortByChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: value as "price" | "area" | "newest" | "rating",
    }));
  }, []);

  const handleSortOrderChange = useCallback((value: "asc" | "desc") => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: value,
    }));
  }, []);

  const handleAmenitiesChange = useCallback((amenities: string[]) => {
    setFilters((prev) => ({
      ...prev,
      amenities: amenities.length > 0 ? amenities : undefined,
    }));
  }, []);

  const handleApply = useCallback(() => {
    // Clean up undefined values
    const cleanFilters: RoomFilterInput = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0)) {
        cleanFilters[key as keyof RoomFilterInput] = value as any;
      }
    });
    onFiltersChange(cleanFilters);
  }, [filters, onFiltersChange]);

  const handleReset = useCallback(() => {
    setFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => v !== undefined && v !== null && v !== "" && (!Array.isArray(v) || v.length > 0)),
    [filters]
  );

  return (
    <Card className="border border-border/50 rounded-[20px] shadow-sm bg-card/80 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold">
          Bộ lọc phòng {hasActiveFilters && <span className="text-sm font-semibold text-primary ml-2">(Đã áp dụng)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 space-y-6">
        {/* Basic Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RoomSearchInput
            value={filters.search || ""}
            onChange={handleSearchChange}
          />
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

        {/* Sorting Section */}
        <div className="border-t border-border/50 pt-4">
          <RoomSort
            sortBy={filters.sortBy || "newest"}
            sortOrder={filters.sortOrder || "desc"}
            onSortByChange={handleSortByChange}
            onSortOrderChange={handleSortOrderChange}
          />
        </div>

        {/* Amenities Section */}
        <div className="border-t border-border/50 pt-4">
          <RoomAmenitiesFilter
            selectedAmenities={filters.amenities || []}
            onAmenitiesChange={handleAmenitiesChange}
          />
        </div>

        {/* Action Buttons */}
        <RoomFiltersActions
          onApply={handleApply}
          onReset={handleReset}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
