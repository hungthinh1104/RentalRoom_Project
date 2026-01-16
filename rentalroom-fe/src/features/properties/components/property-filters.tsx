"use client";

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyType } from "@/types/enums";
import { type PropertyFilterInput } from "../schemas";
import { PROPERTY_TYPE_LABELS } from "../constants";


interface PropertyFiltersProps {
  onFiltersChange: (filters: PropertyFilterInput) => void;
  showAdvanced?: boolean;
}

export function PropertyFilters({ onFiltersChange, showAdvanced = true }: PropertyFiltersProps) {
  const [filters, setFilters] = useState<PropertyFilterInput>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== "");

  const handleChange = <K extends keyof PropertyFilterInput>(key: K, value: PropertyFilterInput[K] | undefined) => {
    const newFilters = { ...filters, [key]: value } as PropertyFilterInput;
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onFiltersChange({});
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Bộ lọc tìm kiếm</CardTitle>
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {Object.values(filters).filter(v => v !== undefined && v !== "").length} đang hoạt động
              </span>
            )}
          </div>
          {showAdvanced && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? "Ẩn" : "Chi tiết"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Tìm kiếm
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Tên bất động sản..."
                className="pl-9"
                value={filters.search || ""}
                onChange={(e) => handleChange("search", e.target.value)}
              />
            </div>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <Label htmlFor="property-type" className="text-sm font-medium">
              Loại bất động sản
            </Label>
            <Select value={filters.propertyType || "all"} onValueChange={(value) => handleChange("propertyType", value === "all" ? undefined : (value as PropertyType))}>
              <SelectTrigger id="property-type">
                <SelectValue placeholder="Chọn loại..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {Object.values(PropertyType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {PROPERTY_TYPE_LABELS[type as PropertyType]}
                  </SelectItem>
                ))}  
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              Thành phố
            </Label>
            <Input
              id="city"
              placeholder="e.g. Hồ Chí Minh"
              value={filters.city || ""}
              onChange={(e) => handleChange("city", e.target.value)}
            />
          </div>
        </div>

        {/* Advanced filters */}
        {isExpanded && showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Ward */}
              <div className="space-y-2">
                <Label htmlFor="ward" className="text-sm font-medium">
                  Phường / Xã
                </Label>
                <Input
                  id="ward"
                  placeholder="Phường/Xã"
                  value={filters.ward || ""}
                  onChange={(e) => handleChange("ward", e.target.value)}
                />
              </div>

              {/* Placeholder for future filters */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Thêm lọc...
                </Label>
                <div className="h-10 rounded-md border border-dashed border-border/50 flex items-center justify-center text-xs text-muted-foreground">
                  Mở rộng các lựa chọn
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Đặt lại
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Bộ lọc áp dụng tức thời
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
