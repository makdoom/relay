import { ArrowUp, Loader, MessageSquare } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import type { MessageItem as MessageItemType } from '@/types/message';
import { MessageItem } from './MessageItem';

type MessageTimelineProps = {
  messages: MessageItemType[];
  currentUserId: string | undefined;
  recipientName?: string;
  peerLastReadMessageId?: string | null;
  hasMore: boolean;
  isLoadingHistory: boolean;
  isLoadingMore: boolean;
  onLoadOlder: () => void;
  onRetryMessage: (id: string) => void;
};

function formatDateDivider(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return 'Today';
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}

const MessageTimeline = ({
  messages,
  isLoadingHistory,
  currentUserId,
  peerLastReadMessageId,
  recipientName,
  isLoadingMore,
  hasMore,
  onLoadOlder,
  onRetryMessage,
}: MessageTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);

  const firstMsgId = messages[0]?.id;
  const lastMsgId = messages[messages.length - 1]?.id;
  const prevFirstMsgIdRef = useRef<string | undefined>(firstMsgId);
  const prevLastMsgIdRef = useRef<string | undefined>(lastMsgId);

  // Capture scrollHeight right before older messages are fetched
  useEffect(() => {
    if (isLoadingMore && containerRef.current) {
      prevScrollHeightRef.current = containerRef.current.scrollHeight;
    }
  }, [isLoadingMore]);

  // Intelligent scroll anchoring: preserve position on older prepend; auto-scroll on newer append
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const olderMessagesPrepended =
      firstMsgId !== prevFirstMsgIdRef.current &&
      lastMsgId === prevLastMsgIdRef.current &&
      messages.length > 0;

    const newMessagesAppended = lastMsgId !== prevLastMsgIdRef.current && messages.length > 0;

    if (olderMessagesPrepended && prevScrollHeightRef.current > 0) {
      // Restore scroll offset to prevent viewport jump
      const heightDiff = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = heightDiff;
      prevScrollHeightRef.current = 0;
    } else if (newMessagesAppended) {
      // Scroll to bottom on initial render or new message
      bottomRef.current?.scrollIntoView({
        behavior: prevLastMsgIdRef.current ? 'smooth' : 'auto',
      });
    }

    prevFirstMsgIdRef.current = firstMsgId;
    prevLastMsgIdRef.current = lastMsgId;
  }, [messages, firstMsgId, lastMsgId]);

  if (isLoadingHistory) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-sm">
        <Loader className="w-5 h-5 animate-spin" />
        <span>Loading message history...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-10 h-10 rounded-full border flex items-center justify-center  mb-3 shadow-inner">
          <MessageSquare className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold">No messages yet</h3>
        <p className="text-xs mt-1 max-w-xs leading-relaxed text-muted-foreground">
          Be the first to send a message and kick off the conversation.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col">
      {/* Keyset Pagination Load Older Action */}
      {hasMore && (
        <div className="flex justify-center my-2">
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={isLoadingMore}
            className="px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader className="w-3 h-3 animate-spin" />
                <span>Loading older messages...</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-3 h-3 text-zinc-400" />
                <span>Load older messages</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Message Feed with Date Dividers */}
      <div className="flex-1 flex flex-col justify-end">
        {messages.map((msg, index) => {
          const isOutgoing = msg.senderId === currentUserId;
          const isRead =
            isOutgoing && Boolean(peerLastReadMessageId && msg.id <= peerLastReadMessageId);
          const currentDateStr = formatDateDivider(msg.createdAt);
          const prevDateStr = index > 0 ? formatDateDivider(messages[index - 1].createdAt) : null;
          const showDateDivider = currentDateStr && currentDateStr !== prevDateStr;

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div className="flex items-center justify-center my-3 select-none">
                  <div className="h-px bg-zinc-800/60 flex-1" />
                  <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-900/80 border border-zinc-800 rounded-full mx-3">
                    {currentDateStr}
                  </span>
                  <div className="h-px bg-zinc-800/60 flex-1" />
                </div>
              )}
              <MessageItem
                message={msg}
                isOutgoing={isOutgoing}
                isRead={isRead}
                senderName={!isOutgoing ? recipientName : undefined}
                onRetry={onRetryMessage}
              />
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} className="h-1 shrink-0" />
      </div>
    </div>
  );
};
export default MessageTimeline;
