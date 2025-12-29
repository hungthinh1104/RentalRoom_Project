"use client";

import { useState, useMemo } from "react";
import { Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomList } from "@/features/rooms/components/room-list";
import { RoomFilters } from "@/features/rooms/components/filters/room-filters";
import { RoomFilterInput } from "@/features/rooms/schemas";
import { AiSearchInput } from "@/features/ai/components/ai-search-input";
import { useAiSearch } from "@/features/ai/hooks/use-ai-search";
import { useRooms } from "@/features/rooms/hooks/use-rooms";

export default function RoomsPage() {
  type Amenity = { type: string };
  type Review = { rating: number };
  type Room = {
    id: string;
    pricePerMonth: number;
    area: number;
    status?: string;
    amenities?: Amenity[];
    reviews?: Review[];
    createdAt: string | Date;
  };
  const [filters, setFilters] = useState<RoomFilterInput>({
    sortBy: "newest",
    sortOrder: "desc"
  });
  const [aiQuery, setAiQuery] = useState("");
  const [searchTab, setSearchTab] = useState<"ai" | "filters">("ai");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // AI Search
  const {
    rooms: aiRooms,
    isLoading: aiLoading,
    isFetching: aiFetching,
    searchMethod,
  } = useAiSearch(aiQuery, filters, {
    searchMode: "hybrid",
    limit: 12,
    enabled: searchTab === "ai",
  });

  // Standard Search (with all filters passed to backend)
  const apiParams = {
    page,
    limit: 12,
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
    ...(filters.minArea && { minArea: filters.minArea }),
    ...(filters.maxArea && { maxArea: filters.maxArea }),
    ...(filters.status && { status: filters.status }),
    ...(filters.city && { city: filters.city }),
    ...(filters.ward && { ward: filters.ward }),
    ...(filters.sortBy && { sortBy: filters.sortBy }),
    ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
  };
  const { data: standardData, isLoading: standardLoading } = useRooms(apiParams);

  // Determine which results to show
  const results = useMemo(() => {
    if (searchTab === "ai" && aiQuery.trim()) {
      return aiRooms;
    } else if (searchTab === "filters" || !aiQuery.trim()) {
      // Return backend results directly (already filtered and sorted)
      return (standardData?.data as Room[]) || [];
    }
    return [];
  }, [searchTab, aiQuery, aiRooms, standardData?.data]);

  const isLoading = searchTab === "ai" ? aiLoading : standardLoading;
  const totalResults = searchTab === "filters" ? (standardData?.total || 0) : results.length;
  const totalPages = Math.ceil(totalResults / 12);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Header - Clean & Minimal */}
      <div className="relative w-full bg-background border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Tìm kiếm thông minh với AI</span>
            </div>
            <h1 className="text-6xl font-bold tracking-tight text-foreground mb-4">
              Tìm phòng trọ
              <span className="block text-5xl mt-2 bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                lý tưởng của bạn
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Khám phá hàng trăm phòng cho thuê với công nghệ AI hoặc tùy chỉnh theo nhu cầu riêng của bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Search Section - Floating Card Style */}
      <div className="sticky top-[4rem] z-20 bg-background/80 backdrop-blur-xl border-b border-border shadow-lg">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={searchTab} onValueChange={(v) => setSearchTab(v as "ai" | "filters")} className="w-full">
            {/* Tab Switcher */}
            <div className="flex items-center justify-center mb-6">
              <TabsList className="inline-flex p-1 bg-muted/50 rounded-xl border border-border/50">
                <TabsTrigger
                  value="ai"
                  className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">Tìm kiếm AI</span>
                </TabsTrigger>
                <TabsTrigger
                  value="filters"
                  className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span className="font-semibold">Bộ lọc chi tiết</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* AI Search Tab */}
            <TabsContent value="ai" className="mt-0 space-y-5">
              <div className="relative">
                <AiSearchInput
                  value={aiQuery}
                  onChange={setAiQuery}
                  isLoading={aiFetching}
                  placeholder="VD: Phòng gần ĐH Bách Khoa, có máy lạnh, dưới 4 triệu/tháng..."
                  showSuggestions
                />
              </div>

              {aiQuery.trim() && !aiLoading && (
                <div className="flex items-center gap-2 flex-wrap animate-in fade-in slide-in-from-top-2 duration-300">
                  <Badge
                    variant="outline"
                    className="border-primary/40 bg-primary/10 text-primary font-medium px-3 py-1.5"
                  >
                    {searchMethod === "semantic"
                      ? "🤖 AI Ngữ nghĩa"
                      : searchMethod === "hybrid"
                        ? "🔀 Kết hợp AI + Bộ lọc"
                        : "⚡ Tìm kiếm thường"}
                  </Badge>
                  {filters && Object.keys(filters).length > 0 && (
                    <Badge variant="secondary" className="font-medium px-3 py-1.5">
                      {Object.keys(filters).length} bộ lọc đang áp dụng
                    </Badge>
                  )}
                </div>
              )}

              {aiQuery.trim() && (
                <details className="group bg-muted/30 rounded-xl border border-border overflow-hidden">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all list-none flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="group-open:rotate-90 transition-transform duration-200">▶</span>
                      Tùy chỉnh thêm bộ lọc
                    </span>
                    <span className="text-xs text-muted-foreground">(Tùy chọn)</span>
                  </summary>
                  <div className="px-4 pb-4 pt-2">
                    <RoomFilters
                      onFiltersChange={(newFilters) => {
                        setFilters(newFilters);
                        setPage(1);
                      }}
                    />
                  </div>
                </details>
              )}
            </TabsContent>

            {/* Filter Search Tab */}
            <TabsContent value="filters" className="mt-0">
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => setFiltersOpen((v) => !v)}
                  className="px-3 py-1 rounded-md bg-muted/20 text-sm font-medium"
                >
                  {filtersOpen ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
                </button>
              </div>
              {filtersOpen && (
                <div className="bg-muted/20 rounded-xl border border-border p-5">
                  <RoomFilters
                    onFiltersChange={(newFilters) => {
                      setFilters(newFilters);
                      setPage(1);
                    }}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Results Header */}
        {results.length > 0 && (
          <div className="flex items-center justify-between py-4 px-6 bg-card rounded-xl border border-border shadow-sm">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {results.length}
              </span>
              <span className="text-base text-muted-foreground font-medium">phòng tìm thấy</span>
            </div>
            {searchTab === "filters" && filters.sortBy && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Sắp xếp:</span>
                <Badge variant="outline" className="font-semibold">
                  {filters.sortBy === "price" ? "Giá" : filters.sortBy === "newest" ? "Mới nhất" : filters.sortBy}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Room List */}
        <RoomList rooms={results} isLoading={isLoading} />

        {/* No Results */}
        {results.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center space-y-8 max-w-lg">
              {/* Icon */}
              <div className="relative mx-auto w-28 h-28">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent rounded-full blur-2xl" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                  <svg
                    className="w-12 h-12 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">
                  {aiQuery.trim()
                    ? "Không tìm thấy phòng phù hợp"
                    : "Chưa có kết quả tìm kiếm"}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {aiQuery.trim()
                    ? "Thử điều chỉnh từ khóa, bỏ bớt bộ lọc hoặc chuyển sang phương thức tìm kiếm khác."
                    : "Hãy bắt đầu tìm kiếm bằng AI hoặc sử dụng bộ lọc để khám phá các phòng có sẵn."}
                </p>
              </div>

              {/* Action Buttons */}
              {aiQuery.trim() && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setAiQuery("")}
                    className="px-5 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors"
                  >
                    Xóa tìm kiếm
                  </button>
                  <button
                    onClick={() => setSearchTab("filters")}
                    className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors shadow-lg"
                  >
                    Dùng bộ lọc
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && searchTab === "filters" && (
          <div className="flex items-center justify-center gap-2 pt-12 pb-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Trang trước"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex gap-2">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[44px] h-11 px-4 rounded-lg font-semibold transition-all duration-200 ${page === pageNum
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                      : "bg-card border border-border text-foreground hover:bg-muted hover:border-primary/30 hover:scale-105"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Trang sau"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
