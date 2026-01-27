"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Search, Loader2, Sparkles, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePopularSearches } from "@/features/ai/hooks/use-ai-search";

interface SearchSuggestion {
  text: string;
  type: "popular" | "history" | "suggestion";
  icon: React.ReactNode;
}

interface AiSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  showSuggestions?: boolean;
  maxSuggestions?: number;
}

export function AiSearchInput({
  value,
  onChange,
  onSearch,
  isLoading = false,
  placeholder = "VD: Phòng trọ gần trường, máy lạnh, dưới 4 triệu",
  showSuggestions = true,
  maxSuggestions = 6,
}: AiSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const history = localStorage.getItem("ai-search-history");
      return history ? JSON.parse(history).slice(0, 5) : [];
    } catch {
      return [];
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage handled in state initializer

  // Fetch popular searches
  const { data: popularSearchesData } = usePopularSearches(showSuggestions);
  const popularSearches = (popularSearchesData?.searches || [])
    .slice(0, 3)
    .map((item: { query: string }) => item.query);

  // Build suggestions
  const suggestions: SearchSuggestion[] = [];

  if (showSuggestions && value.length === 0) {
    // Show popular searches when input is empty
    if (popularSearches.length > 0) {
      suggestions.push(
        ...popularSearches.map((search: string) => ({
          text: search,
          type: "popular" as const,
          icon: <TrendingUp className="w-4 h-4 text-warning" />,
        }))
      );
    }

    // Show recent search history
    if (searchHistory.length > 0) {
      suggestions.push(
        ...searchHistory.map((search: string) => ({
          text: search,
          type: "history" as const,
          icon: <Clock className="w-4 h-4 text-info" />,
        }))
      );
    }
  } else if (value.length > 1) {
    // Show matching popular searches
    const matchingSearches = popularSearches.filter((search: string) =>
      search.toLowerCase().includes(value.toLowerCase())
    );
    if (matchingSearches.length > 0) {
      suggestions.push(
        ...matchingSearches.slice(0, 2).map((search: string) => ({
          text: search,
          type: "suggestion" as const,
          icon: <Search className="w-4 h-4 text-primary" />,
        }))
      );
    }
  }

  const handleSelect = useCallback(
    (text: string) => {
      onChange(text);
      setIsOpen(false);
      // Save to history
      const newHistory = [text, ...searchHistory.filter((h) => h !== text)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem("ai-search-history", JSON.stringify(newHistory));
      // Trigger search
      if (onSearch) {
        onSearch(text);
      }
    },
    [onChange, onSearch, searchHistory]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        setIsOpen(false);
        if (onSearch && value.trim()) {
          handleSelect(value.trim());
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [value, onSearch, handleSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      setIsOpen(true);
    },
    [onChange]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="space-y-2">
        <Label htmlFor="ai-search" className="text-base font-semibold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Tìm kiếm bằng AI
          </div>
          <p className="text-xs text-muted-foreground font-normal mt-1">
            Mô tả phòng mà bạn tìm bằng tiếng Việt tự nhiên
          </p>
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            id="ai-search"
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (showSuggestions) {
                setIsOpen(true);
              }
            }}
            disabled={isLoading}
            className="pl-10 pr-10 h-12 bg-muted/50 border-primary/20 focus:border-primary focus:bg-background"
            aria-label="Tìm kiếm phòng bằng AI"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls="ai-search-suggestions"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && showSuggestions && suggestions.length > 0 && (
        <div
          id="ai-search-suggestions"
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top"
        >
          <div className="max-h-96 overflow-y-auto">
            {suggestions.slice(0, maxSuggestions).map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.text}-${index}`}
                onClick={() => handleSelect(suggestion.text)}
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 group"
              >
                {suggestion.icon}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                    {suggestion.text}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.type === "popular"
                      ? "Tìm kiếm phổ biến"
                      : suggestion.type === "history"
                        ? "Tìm kiếm gần đây"
                        : "Gợi ý"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {isOpen && showSuggestions && suggestions.length === 0 && value.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Hãy nhấn Enter để tìm kiếm &quot;{value}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
