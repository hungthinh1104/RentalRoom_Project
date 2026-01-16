"use client";

import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function AIChatInput({ onSend, disabled }: AIChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập câu hỏi của bạn..."
        disabled={disabled}
        className="min-h-[44px] max-h-[120px] resize-none"
        rows={1}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        className={cn(
          "h-[44px] w-[44px] flex-shrink-0",
          !input.trim() && "opacity-50"
        )}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
