"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyType } from "@/types/enums";
import { type PropertyFilterInput } from "../schemas";

interface PropertyFiltersProps {
  onFiltersChange: (filters: PropertyFilterInput) => void;
}

export function PropertyFilters({ onFiltersChange }: PropertyFiltersProps) {
  const [filters, setFilters] = useState<PropertyFilterInput>({});

  const handleChange = (key: keyof PropertyFilterInput, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (!value) delete newFilters[key];
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
              placeholder="Search properties..."
              className="pl-9"
              value={filters.search || ""}
              onChange={(e) => handleChange("search", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Property Type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={filters.propertyType || ""}
            onChange={(e) => handleChange("propertyType", e.target.value as PropertyType)}
          >
            <option value="">All Types</option>
            {Object.values(PropertyType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>City</Label>
          <Input
            placeholder="Enter city"
            value={filters.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>District</Label>
          <Input
            placeholder="Enter district"
            value={filters.district || ""}
            onChange={(e) => handleChange("district", e.target.value)}
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
