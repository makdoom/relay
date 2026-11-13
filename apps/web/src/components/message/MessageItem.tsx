import { AlertCircle, Check, CheckCheck, Clock, RefreshCw } from 'lucide-react';
import type { MessageItem as MessageItemType } from '@/types/message';

interface MessageItemProps {
  message: MessageItemType;
  isOutgoing: boolean;
  senderName?: string;
  isRead?: boolean;
  onRetry?: (id: string) => void;
}

function formatMessageTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOutgoing,
  senderName,
  isRead,
  onRetry,
}) => {
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
          <div className="whitespace-pre-wrap wrap-break-word">{message.content}</div>

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

  // Incoming Message Bubble
  const initials = senderName
    ? senderName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="flex items-start gap-2.5 my-1.5 select-text group max-w-[82%] sm:max-w-[72%]">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold flex items-center justify-center text-[10px] shrink-0 mt-0.5 select-none">
        {initials}
      </div>

      <div className="flex flex-col items-start min-w-0">
        {/* Sender Name & Timestamp */}
        {senderName && (
          <div className="flex items-baseline gap-2 mb-1 px-1">
            <span className="text-[11px] font-medium text-zinc-300 truncate">{senderName}</span>
            <span className="text-[10px] font-mono text-zinc-400">{timeFormatted}</span>
          </div>
        )}

        {/* Bubble */}
        <div className="rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-[#13151b] border border-white/5 text-zinc-200 shadow-sm text-xs leading-relaxed whitespace-pre-wrap wrap-break-word">
          {message.content}
        </div>
      </div>
    </div>
  );
};
