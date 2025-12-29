"use client";

import { cn } from "@/lib/utils";
import { ChatMessage } from "../hooks/use-ai-chat";
import { User, Sparkles, MapPin, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";

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

export function AIChatMessages({ messages }: AIChatMessagesProps) {
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
                  : "bg-white dark:bg-card border border-border rounded-tl-sm"
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
                  {sanitizeMarkdown(message.content)}
                </div>
              )}
            </div>

            {/* Room Cards - Render when rooms exist */}
            {message.rooms && message.rooms.length > 0 && (
              <div className="w-full mt-2 space-y-2">
                {message.rooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/rooms/${room.id}`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            Phòng {room.roomNumber}
                          </span>
                          {room.status === 'AVAILABLE' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                              Còn trống
                            </span>
                          )}
                        </div>
                        {room.propertyName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{room.propertyName}</span>
                          </div>
                        )}
                        {room.area && (
                          <span className="text-xs text-muted-foreground">
                            {room.area}m²
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary text-sm">
                          {room.price?.toLocaleString('vi-VN')}đ
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/rooms"
                  className="block text-center py-2 text-xs text-primary hover:underline font-medium"
                >
                  Xem tất cả phòng →
                </Link>
              </div>
            )}

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

