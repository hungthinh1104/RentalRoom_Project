import { Injectable, Logger } from '@nestjs/common';
import { AiModelFactory } from './ai-model.factory';
import { SearchService } from './search.service';

export interface ChatRoom {
  id: string;
  roomNumber: string;
  price: number;
  propertyName?: string;
  area?: number;
  status?: string;
}

export interface ChatResponse {
  response: string;
  rooms?: ChatRoom[];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly modelFactory: AiModelFactory,
    private readonly searchService: SearchService,
  ) {}

  async chatWithAI(message: string, context?: string): Promise<ChatResponse> {
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
- KHÔNG liệt kê phòng trong câu trả lời, hệ thống sẽ tự động hiển thị kết quả tìm kiếm

Ví dụ tốt:
"Phòng gần trường ĐH giá dưới 3 triệu thường có ở khu vực sinh viên. Bạn nên tìm trong bán kính 2-3km từ trường. Tôi đang tìm các phòng phù hợp cho bạn..."`;

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
          // Return structured response with rooms
          const rooms: ChatRoom[] = searchResults.map((room: any) => ({
            id: room.id,
            roomNumber: room.roomNumber || 'N/A',
            price: room.pricePerMonth || room.price || 0,
            propertyName: room.property?.name || room.propertyName || undefined,
            area: room.area || undefined,
            status: room.status || undefined,
          }));

          return {
            response:
              aiResponse + '\n\nĐây là các phòng phù hợp với yêu cầu của bạn:',
            rooms,
          };
        }
      } catch (error: unknown) {
        this.logger.debug('Search failed, returning AI response only:', error);
      }
    }

    return { response: aiResponse };
  }
}
