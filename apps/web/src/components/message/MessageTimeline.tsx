import { Loader, MessageSquare } from 'lucide-react';
import React, { useRef } from 'react';
import type { MessageItem as MessageItemType } from '@/types/message';
import MessageItem from './MessageItem';

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
}: MessageTimelineProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  console.log({ recipientName });
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
    <div className="flex flex-1 overflow-y-auto px-4 py-3 flex-col">
      {/* Message Feed with Date Dividers */}
      <div className="flex-1 flex flex-col justify-end gap-1">
        {messages.map((msg, index) => {
          const isOutgoing = msg.senderId === currentUserId;
          const isRead =
            isOutgoing && Boolean(peerLastReadMessageId && msg.id <= peerLastReadMessageId);
          const currentDateStr = formatDateDivider(msg.createdAt);
          const prevDateStr = index > 0 ? formatDateDivider(messages[index - 1].createdAt) : null;
          const showDateDivider = currentDateStr && currentDateStr !== prevDateStr;

          console.log({ isOutgoing });
          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div className="flex items-center justify-center my-3 select-none">
                  <div className="h-px flex-1 bg-muted" />
                  <span className="px-2.5 py-0.5 text-xs tracking-wider border rounded-full mx-3">
                    {currentDateStr}
                  </span>
                  <div className="h-px flex-1 bg-muted" />
                </div>
              )}
              <MessageItem
                message={msg}
                isOutgoing={isOutgoing}
                isRead={isRead}
                senderName={!isOutgoing ? recipientName : undefined}
                // onRetry={onRetryMessage}
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
