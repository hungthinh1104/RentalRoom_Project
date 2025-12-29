"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RoomStatus } from "@/types/enums";
import { type RoomFilterInput } from "../schemas";

interface RoomFiltersProps {
  onFiltersChange: (filters: RoomFilterInput) => void;
}

export function RoomFilters({ onFiltersChange }: RoomFiltersProps) {
  const [filters, setFilters] = useState<RoomFilterInput>({});

  const handleChange = (key: keyof RoomFilterInput, value: RoomFilterInput[keyof RoomFilterInput] | undefined) => {
    const newFilters: RoomFilterInput = { ...filters, [key]: value } as RoomFilterInput;
    if (value === undefined || value === null || value === "") {
      const rec = newFilters as Record<string, unknown>;
      delete rec[key as string];
    }
    setFilters(newFilters);
  };

  const handleApply = () => {
    onFiltersChange(filters);
  };

  const handleReset = () => {
    setFilters({});
    onFiltersChange({});
  };

  return (
    <Card className="mb-6">
      <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              className="pl-9"
              value={filters.search || ""}
              onChange={(e) => handleChange("search", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={filters.status || ""}
            onChange={(e) => handleChange("status", e.target.value as RoomStatus)}
          >
            <option value="">All Statuses</option>
            {Object.values(RoomStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Min Price</Label>
          <Input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice || ""}
            onChange={(e) => handleChange("minPrice", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label>Max Price</Label>
          <Input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice || ""}
            onChange={(e) => handleChange("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <X className="size-4" /> Reset
        </Button>
        <Button onClick={handleApply}>Apply Filters</Button>
      </div>
      </CardContent>
    </Card>
  );
}
