"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { X, MessageCircle, Sparkles, Loader2, Trash2 } from "lucide-react";
import { useAIChat, CHAT_SUGGESTIONS } from "../hooks/use-ai-chat";
import { AIChatInput } from "./ai-chat-input";
import { AIChatMessages } from "./ai-chat-messages";

import { useEffect, useRef } from "react";

export function AIChatWidget() {
  const { messages, isOpen, isLoading, sendMessage, clearHistory, toggleOpen } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!isOpen) {
    return (
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-primary hover:bg-primary/90 animate-in zoom-in duration-300"
        onClick={toggleOpen}
        aria-label="Open AI Chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[90vw] sm:w-[380px] h-[600px] max-h-[80vh] shadow-2xl z-50 flex flex-col border rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in-20 duration-300 p-0 gap-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Trợ lý ảo AI</h3>
            <p className="text-[10px] text-primary-foreground/80">Luôn sẵn sàng hỗ trợ bạn</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-white"
              onClick={clearHistory}
              title="Xóa lịch sử chat"
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-white"
            onClick={toggleOpen}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-3 bg-muted/10" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm">
                <div className="h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-semibold text-base">Xin chào! 👋</h4>
              <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
                Tôi là trợ lý ảo chuyên về bất động sản. Bạn cần tìm phòng như thế nào?
              </p>
            </div>

            <div className="grid gap-1.5 w-full">
              {CHAT_SUGGESTIONS.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2 px-3 whitespace-normal rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-colors text-xs"
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <AIChatMessages messages={messages} />
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <AIChatInput onSend={sendMessage} disabled={isLoading} />
        <div className="mt-2 flex justify-center">
          <span className="text-[10px] text-muted-foreground">
            AI có thể đưa ra thông tin không chính xác.
          </span>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center z-10">
          <div className="bg-background/80 p-3 rounded-full shadow-lg border backdrop-blur-md">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </div>
      )}
    </Card>
  );
}
