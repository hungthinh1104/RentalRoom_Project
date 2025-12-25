import { Injectable, Logger } from '@nestjs/common';
import { AiModelFactory } from './ai-model.factory';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(private readonly modelFactory: AiModelFactory) {}

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

    const responseContent = response.content as
      | string
      | Array<{ text: string }>;
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

    const result = JSON.parse(jsonStr);
    this.logger.debug('Room description analyzed successfully');
    return result;
  }
}
