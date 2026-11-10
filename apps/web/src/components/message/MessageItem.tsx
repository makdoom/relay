import { AlertCircle, Check, CheckCheck, Clock, RefreshCw } from 'lucide-react';
import type { MessageItem as MessageItemType } from '@/types/message';
import { Bubble, BubbleContent } from '../ui/bubble';
import { Message, MessageContent } from '../ui/message';

type MessageItemProps = {
  message: MessageItemType;
  isOutgoing: boolean;
  senderName?: string;
  isRead?: boolean;
  onRetry?: (id: string) => void;
};

function formatMessageTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

const MessageItem = ({ message, isOutgoing, senderName, isRead, onRetry }: MessageItemProps) => {
  const timeFormatted = formatMessageTime(message.createdAt);

  if (isOutgoing) {
    const isPending = message.status === 'pending';
    const isFailed = message.status === 'failed';

    return (
      <div className="flex flex-col items-end my-1.5 select-text group">
        <div
          className={`relative max-w-[82%] sm:max-w-[72%] rounded-2xl rounded-tr-xs px-3.5 py-2.5 shadow-sm text-xs leading-relaxed transition-all ${
            isFailed
              ? 'bg-red-950/30 border border-red-500/40 text-red-100 shadow-red-950/20'
              : 'bg-[#1f222d] border border-white/10 text-zinc-100 shadow-inner'
          }`}
        >
          {/* Content */}
          <div className="whitespace-pre-wrap break-words">{message.content}</div>

          {/* Sub-bar: Timestamp & Status icon */}
          <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] font-mono text-zinc-400">
            <span>{timeFormatted}</span>
            {isPending && (
              <span
                className="flex items-center gap-0.5 text-amber-400/90"
                title="In flight (persisting to PostgreSQL)"
              >
                <Clock className="w-3 h-3 animate-pulse" />
              </span>
            )}
            {message.status === 'sent' &&
              (isRead ? (
                <span className="flex items-center text-sky-400" title="Read by recipient">
                  <CheckCheck className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="flex items-center text-zinc-400" title="Delivered to server">
                  <Check className="w-3 h-3" />
                </span>
              ))}
          </div>
        </div>

        {/* Failed Action Retry Bar */}
        {isFailed && (
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-red-400 px-1 font-sans">
            <AlertCircle className="w-3 h-3 shrink-0 text-red-400" />
            <span>Failed to send</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => onRetry?.(message.id)}
              className="inline-flex items-center gap-1 font-medium text-red-300 hover:text-white underline underline-offset-2 cursor-pointer transition-colors"
              title="Retry with the same idempotency key (ADR-003)"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Tap to retry</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Message align="end">
      <MessageContent>
        <Bubble variant="secondary">
          <BubbleContent className="flex flex-col">
            <p className="text-sm">{message.content}</p>
            <span className="text-[11px] text-muted-foreground flex items-center justify-end">
              12:08 am
            </span>
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
};
export default MessageItem;
