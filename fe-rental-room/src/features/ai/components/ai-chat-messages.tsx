"use client";

import { cn } from "@/lib/utils";
import { ChatMessage } from "../hooks/use-ai-chat";
import { Loader2, User, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { roomsApi } from "@/features/rooms/api/rooms-api";

interface AIChatMessagesProps {
  messages: ChatMessage[];
}

// Clean markdown syntax from AI responses
function sanitizeMarkdown(text: string): string {
  return text
    // Remove bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic: *text* or _text_
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove headers: ## Header
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bullet points: - item or * item
    .replace(/^\s*[-*]\s+/gm, '')
    // Remove code blocks: ```code```
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code: `code`
    .replace(/`(.+?)`/g, '$1')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Parse and format message with room links
function formatMessage(text: string, onRoomClick: (roomNumber: string) => void) {
  const lines = text.split('\n');
  const parts: (string | React.ReactNode)[] = [];
  let inRoomList = false;
  let roomIndex = 0; // Counter for unique keys

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('Phòng phù hợp:')) {
      inRoomList = true;
      parts.push(line);
      parts.push('\n');
    } else if (line.startsWith('• ') && inRoomList) {
      // Format room item with link
      const roomMatch = line.match(/• (.*?) -/);
      if (roomMatch) {
        const roomNumber = roomMatch[1].trim();
        parts.push('• ');
        parts.push(
          <button
            key={`room-${roomNumber}-${roomIndex++}`}
            onClick={() => onRoomClick(roomNumber)}
            className="text-primary hover:underline font-medium"
            aria-label={`Xem phòng ${roomNumber}`}
          >
            {roomNumber}
          </button>
        );
        parts.push(line.substring(roomMatch[0].length));
      } else {
        parts.push(line);
      }
      parts.push('\n');
    } else if (line.includes('Bạn có thể xem chi tiết tại /rooms')) {
      inRoomList = false;
      parts.push(
        <div key="rooms-link" className="mt-2 pt-2 border-t border-border/30">
          <a
            href="/rooms"
            className="text-primary hover:underline text-xs font-medium"
          >
            → Xem tất cả phòng
          </a>
        </div>
      );
    } else {
      parts.push(line);
      if (i < lines.length - 1) parts.push('\n');
    }
  }

  return parts;
}

export function AIChatMessages({ messages }: AIChatMessagesProps) {
  const router = useRouter();

  async function handleRoomClick(roomNumber: string) {
    // Navigate to rooms search with room number as filter
    // Backend would handle the search/filter
    router.push(`/rooms?search=${encodeURIComponent(roomNumber)}`);
  }
  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-2 animate-in fade-in-50 slide-in-from-bottom-2",
            message.role === "user" ? "flex-row-reverse" : "flex-row"
          )}
        >
          {/* Avatar */}
          <div
            className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            {message.role === "user" ? (
              <User className="h-3.5 w-3.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
          </div>

          {/* Message bubble */}
          <div
            className={cn(
              "flex flex-col gap-1 max-w-[80%]",
              message.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-3 py-2 text-sm shadow-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-white border border-border rounded-tl-sm"
              )}
            >
              {message.isTyping ? (
                <div className="flex items-center gap-1 py-1">
                  <span className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                  {Array.isArray(formatMessage(sanitizeMarkdown(message.content), handleRoomClick)) ? (
                    formatMessage(sanitizeMarkdown(message.content), handleRoomClick)
                  ) : (
                    sanitizeMarkdown(message.content)
                  )}
                </div>
              )}
            </div>
            {!message.isTyping && (
              <span className="text-xs text-muted-foreground px-2">
                {format(message.timestamp, "HH:mm", { locale: vi })}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
