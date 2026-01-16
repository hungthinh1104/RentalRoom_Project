"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface RoomFiltersActionsProps {
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function RoomFiltersActions({
  onApply,
  onReset,
  isLoading = false,
}: RoomFiltersActionsProps) {
  const handleApply = useCallback(() => {
    onApply();
  }, [onApply]);

  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleApply}
        disabled={isLoading}
        className="flex-1"
      >
        {isLoading ? "Đang áp dụng..." : "Áp dụng bộ lọc"}
      </Button>
      <Button
        onClick={handleReset}
        variant="outline"
        disabled={isLoading}
        size="icon"
        title="Đặt lại bộ lọc"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
