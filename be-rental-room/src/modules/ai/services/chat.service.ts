import { Injectable, Logger } from '@nestjs/common';
import { AiModelFactory } from './ai-model.factory';
import { SearchService } from './search.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly modelFactory: AiModelFactory,
    private readonly searchService: SearchService,
  ) {}

  async chatWithAI(message: string, context?: string): Promise<string> {
    if (!message || !message.trim()) {
      throw new Error('Message cannot be empty');
    }

    const chatModel = this.modelFactory.getChatModel();

    // System prompt for Vietnamese rental room assistant
    const systemPrompt = `Bạn là trợ lý AI hỗ trợ tìm phòng trọ tại Việt Nam.

QUY TẮC TRẢ LỜI:
- Trả lời ngắn gọn, súc tích (tối đa 3-4 câu cho câu hỏi đơn giản)
- KHÔNG dùng markdown syntax (**bold**, ##heading, *italic*, - list)
- Chỉ dùng text thuần, xuống dòng tự nhiên
- Nếu cần liệt kê: dùng số thứ tự (1. 2. 3.) không dùng dấu gạch đầu dòng
- Câu trả lời thân thiện, tự nhiên như chat thông thường
- Tập trung vào thông tin thiết yếu, không dài dòng

Ví dụ tốt:
"Phòng gần trường ĐH giá dưới 3 triệu thường có ở khu vực sinh viên. Bạn nên tìm trong bán kính 2-3km từ trường. Các tiện nghi cơ bản như wifi, WC riêng thường có sẵn trong mức giá này."

Ví dụ SAI (dùng markdown):
"**Phòng gần trường** với giá dưới 3 triệu:
- Tìm trong bán kính 2-3km
- Nên có wifi
## Lưu ý quan trọng"`;

    let fullPrompt = message;
    if (context) {
      fullPrompt = `${systemPrompt}\n\nLịch sử chat:\n${context}\n\nCâu hỏi mới: ${message}\n\nTrả lời ngắn gọn, không dùng markdown:`;
    } else {
      fullPrompt = `${systemPrompt}\n\nCâu hỏi: ${message}\n\nTrả lời ngắn gọn, không dùng markdown:`;
    }

    // Get AI response first
    const response = await chatModel.invoke([
      {
        role: 'user',
        content: fullPrompt,
      },
    ] as any);

    const responseContent = response.content as
      | string
      | Array<{ text: string }>;
    let aiResponse = '';
    if (typeof responseContent === 'string') {
      aiResponse = responseContent;
    } else if (Array.isArray(responseContent) && responseContent.length > 0) {
      aiResponse = (responseContent[0] as { text: string }).text;
    } else {
      throw new Error('Unexpected response format from AI');
    }

    // Check if user is asking for room search (keywords: tìm, phòng, giá, wifi, máy lạnh, etc.)
    const searchKeywords = [
      'tìm',
      'phòng',
      'giá',
      'wifi',
      'máy lạnh',
      'gần',
      'trường',
      'dưới',
      'trên',
      'khoảng',
      'bao nhiêu',
      'như thế nào',
    ];
    const shouldSearch = searchKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword),
    );

    if (shouldSearch) {
      try {
        // Extract search query from message (remove common prefixes)
        const cleanQuery = message
          .replace(/tìm\s+/i, '')
          .replace(/cần\s+/i, '')
          .replace(/muốn\s+/i, '')
          .trim();

        // Perform semantic search
        const searchResults = await this.searchService.semanticSearch(
          cleanQuery,
          5,
        );

        if (searchResults && searchResults.length > 0) {
          // Format search results with links
          const roomLinks = searchResults
            .map(
              (room: any) =>
                `• ${room.roomNumber} - ${room.price?.toLocaleString() || 'N/A'} VNĐ`,
            )
            .join('\n');

          return `${aiResponse}\n\nPhòng phù hợp:\n${roomLinks}\n\nBạn có thể xem chi tiết tại /rooms`;
        }
      } catch (error: unknown) {
        this.logger.debug('Search failed, returning AI response only:', error);
      }
    }

    return aiResponse;
  }
}
