
import React from 'react';
import { CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { format } from 'date-fns';

export default function ChatMessage({ message, isOwnMessage }) {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return format(date, 'HH:mm');
  };

  return (
    <div className={cn("flex w-full mb-4", isOwnMessage ? "justify-end" : "justify-start")}>
      <div 
        className={cn(
          "max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm relative group",
          isOwnMessage 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-muted border border-border text-foreground rounded-tl-sm"
        )}
      >
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-primary">
              {message.sender_name || 'Teknisi'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {message.sender_role}
            </span>
          </div>
        )}
        
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.message_content}
        </p>
        
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1",
          isOwnMessage ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
          <span className="text-[10px]">{formatTime(message.created_at || message.created)}</span>
          {isOwnMessage && (
            <CheckCheck
              className={cn(
                "h-3.5 w-3.5 ml-1",
                message.is_read
                  ? "text-primary-foreground/90"
                  : "text-primary-foreground/50"
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
