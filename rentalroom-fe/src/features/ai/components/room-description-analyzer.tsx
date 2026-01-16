"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Tag,
  Home,
  Star,
} from "lucide-react";
import { useState } from "react";
import { useRoomAnalysis, normalizeAmenities } from "../hooks/use-room-analysis";
import { cn } from "@/lib/utils";

interface RoomDescriptionAnalyzerProps {
  onAnalyzed?: (result: {
    amenities: string[];
    priceRange: { min: number; max: number };
    roomType: string;
  }) => void;
  className?: string;
}

export function RoomDescriptionAnalyzer({
  onAnalyzed,
  className,
}: RoomDescriptionAnalyzerProps) {
  const [description, setDescription] = useState("");
  const { isAnalyzing, result, error, analyze, reset } = useRoomAnalysis();

  const handleAnalyze = () => {
    analyze(description);
  };

  const handleApply = () => {
    if (!result) return;

    const normalizedAmenities = normalizeAmenities(result.amenities);

    onAnalyzed?.({
      amenities: normalizedAmenities,
      priceRange: result.estimated_price_range,
      roomType: result.room_type,
    });

    // Keep result visible but allow re-analysis
  };

  const handleReset = () => {
    setDescription("");
    reset();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <Card className={cn("p-6 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Phân tích mô tả tự động</h3>
          <p className="text-sm text-muted-foreground">
            AI sẽ tự động trích xuất thông tin từ mô tả phòng
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dán mô tả phòng từ Facebook, Zalo hoặc nhập thủ công...
Ví dụ: 'Phòng trọ 25m2, full nội thất, có máy lạnh, wifi, wc riêng, gần trường ĐH, giá 3 triệu/tháng'"
          className="min-h-[120px] resize-none"
          disabled={isAnalyzing}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={!description.trim() || isAnalyzing}
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Phân tích ngay
              </>
            )}
          </Button>
          {(result || error) && (
            <Button variant="outline" onClick={handleReset}>
              Làm mới
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-top-2">
          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Phân tích thành công!
          </div>

          {/* Room Type */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Home className="h-4 w-4" />
              Loại phòng
            </div>
            <Badge variant="secondary" className="text-sm">
              {result.room_type}
            </Badge>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Giá thị trường dự kiến
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {formatPrice(result.estimated_price_range.min)}
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="outline" className="text-sm">
                {formatPrice(result.estimated_price_range.max)}
              </Badge>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" />
              Tiện nghi ({result.amenities.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {result.amenities.map((amenity, idx) => (
                <Badge key={idx} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          {/* Key Features */}
          {result.key_features.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Star className="h-4 w-4" />
                Đặc điểm nổi bật
              </div>
              <div className="flex flex-wrap gap-2">
                {result.key_features.map((feature, idx) => (
                  <Badge key={idx} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Đánh giá chung</div>
            <Badge
              variant={
                result.sentiment === "positive"
                  ? "default"
                  : result.sentiment === "negative"
                  ? "destructive"
                  : "secondary"
              }
            >
              {result.sentiment === "positive"
                ? "Tích cực ✨"
                : result.sentiment === "negative"
                ? "Tiêu cực"
                : "Trung lập"}
            </Badge>
          </div>

          {/* Apply Button */}
          {onAnalyzed && (
            <Button onClick={handleApply} className="w-full" size="lg">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Áp dụng vào form
            </Button>
          )}
        </div>
      )}

      {/* Help text */}
      {!result && !error && !isAnalyzing && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Mẹo:</strong> Mô tả càng chi tiết, AI sẽ phân tích càng chính xác.
            Nên bao gồm: diện tích, tiện nghi, vị trí, giá cả.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
