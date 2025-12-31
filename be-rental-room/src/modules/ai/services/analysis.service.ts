import { Injectable, Logger } from '@nestjs/common';
import { AiModelFactory } from './ai-model.factory';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(private readonly modelFactory: AiModelFactory) { }

  async analyzeRoomDescription(text: string): Promise<{
    amenities: string[];
    sentiment: string;
    estimated_price_range: { min: number; max: number };
    room_type: string;
    key_features: string[];
  }> {
    if (!text || !text.trim()) {
      throw new Error('Room description cannot be empty');
    }

    const chatModel = this.modelFactory.getChatModel();
    const prompt = `Analyze this Vietnamese room description and extract structured data:

"${text}"

Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "amenities": ["wifi", "bed", "ac", ...],
  "sentiment": "positive|neutral|negative",
  "estimated_price_range": { "min": number, "max": number },
  "room_type": "phòng_trọ|chung_cư|nhà_nguyên_căn|phòng_chia_sẻ",
  "key_features": ["feature1", "feature2", ...]
}

Notes:
- amenities: List common items found (wifi, bed, air conditioning, balcony, etc.)
- sentiment: Overall impression from description tone
- estimated_price_range: VND per month (estimate based on description details)
- room_type: Classify the room type
- key_features: Extract 2-3 main selling points`;

    const response = await chatModel.invoke([
      {
        role: 'user',
        content: prompt,
      },
    ] as any);

    const result = this.parseJsonResponse(response);
    this.logger.debug('Room description analyzed successfully');
    return result;
  }

  /**
   * Analyze natural language search query to extract filters
   *
   * @param query - User's search query (e.g., "phòng dưới 3 triệu quận 1")
   * @returns Structured filters and cleaned query
   */
  async analyzeSearchQuery(query: string): Promise<{
    filters: {
      minPrice?: number;
      maxPrice?: number;
      minArea?: number;
      maxArea?: number;
      amenities?: string[];
      location?: string;
    };
    cleanedQuery: string; // Query with filter terms removed (for keyword search)
  }> {
    if (!query || !query.trim()) return { filters: {}, cleanedQuery: query };

    const chatModel = this.modelFactory.getChatModel();
    const prompt = `Analyze this Vietnamese rental search query: "${query}"

Extract structured filters and the remaining keyword essence.
Return ONLY valid JSON:
{
  "filters": {
    "minPrice": number | null,       // extracted price floor (VND)
    "maxPrice": number | null,       // extracted price ceiling (VND) - e.g., "dưới 3 triệu" -> 3000000
    "minArea": number | null,        // extracted area floor (m2)
    "maxArea": number | null,        // extracted area ceiling (m2)
    "amenities": string[],           // e.g., ["wifi", "ac", "parking"]
    "location": string | null        // district or city mentioned
  },
  "cleanedQuery": string             // The query WITHOUT the extracted price/area/location terms (kept for fuzzy matching)
}

Example: "phòng trọ sạch sẽ dưới 3 triệu quận 1 có máy lạnh"
Output:
{
  "filters": { "maxPrice": 3000000, "location": "Quận 1", "amenities": ["ac"] },
  "cleanedQuery": "phòng trọ sạch sẽ"
}`;

    try {
      const response = await chatModel.invoke([
        { role: 'user', content: prompt }
      ] as any);

      const result = this.parseJsonResponse(response);
      this.logger.debug(`Analyzed query: "${query}" -> ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.warn(`Failed to analyze query: ${query}`, error);
      return { filters: {}, cleanedQuery: query };
    }
  }

  // Helper to parse JSON from AI response
  private parseJsonResponse(response: any): any {
    const responseContent = response.content as string | Array<{ text: string }>;
    let responseText: string;

    if (typeof responseContent === 'string') {
      responseText = responseContent;
    } else if (Array.isArray(responseContent) && responseContent.length > 0) {
      responseText = (responseContent[0] as { text: string }).text;
    } else {
      throw new Error('Unexpected response format from AI');
    }

    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(jsonStr);
  }
}
