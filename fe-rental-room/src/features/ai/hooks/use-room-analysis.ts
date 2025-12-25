import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiApi } from '../api/ai-api';

export interface RoomAnalysisResult {
  amenities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  estimated_price_range: {
    min: number;
    max: number;
  };
  room_type: string;
  key_features: string[];
}

export interface AnalysisState {
  isAnalyzing: boolean;
  result: RoomAnalysisResult | null;
  error: string | null;
}

export function useRoomAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    result: null,
    error: null,
  });

  const analysisMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await aiApi.analyzeRoomDescription(description);
      return response.analysis;
    },
    onSuccess: (data: RoomAnalysisResult) => {
      setState({
        isAnalyzing: false,
        result: data,
        error: null,
      });
    },
    onError: (error: any) => {
      setState({
        isAnalyzing: false,
        result: null,
        error: error?.message || 'Phân tích thất bại. Vui lòng thử lại.',
      });
    },
  });

  const analyze = useCallback((description: string) => {
    if (!description.trim()) {
      setState({
        isAnalyzing: false,
        result: null,
        error: 'Vui lòng nhập mô tả phòng',
      });
      return;
    }

    setState({
      isAnalyzing: true,
      result: null,
      error: null,
    });

    analysisMutation.mutate(description);
  }, [analysisMutation]);

  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyze,
    reset,
  };
}

// Map AI amenities to form field values
export const AMENITY_MAPPING: Record<string, string> = {
  wifi: 'wifi',
  'máy lạnh': 'air_conditioning',
  'máy lanh': 'air_conditioning',
  ac: 'air_conditioning',
  'air conditioning': 'air_conditioning',
  'wc riêng': 'private_bathroom',
  'toilet riêng': 'private_bathroom',
  'nhà vệ sinh riêng': 'private_bathroom',
  'private bathroom': 'private_bathroom',
  'bếp': 'kitchen',
  kitchen: 'kitchen',
  'tủ lạnh': 'refrigerator',
  fridge: 'refrigerator',
  refrigerator: 'refrigerator',
  'giường': 'bed',
  bed: 'bed',
  'tủ quần áo': 'wardrobe',
  wardrobe: 'wardrobe',
  'bàn làm việc': 'desk',
  desk: 'desk',
  'ban công': 'balcony',
  balcony: 'balcony',
  'thang máy': 'elevator',
  elevator: 'elevator',
  'bãi đỗ xe': 'parking',
  parking: 'parking',
  'máy giặt': 'washing_machine',
  'washing machine': 'washing_machine',
  'bảo vệ': 'security',
  security: 'security',
};

// Normalize amenity names
export function normalizeAmenities(amenities: string[]): string[] {
  return amenities
    .map((amenity) => {
      const normalized = amenity.toLowerCase().trim();
      return AMENITY_MAPPING[normalized] || normalized;
    })
    .filter((amenity, index, self) => self.indexOf(amenity) === index); // Remove duplicates
}
