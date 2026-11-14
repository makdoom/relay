import { Hash } from 'lucide-react';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { useMessages } from '@/hooks/useMessage';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import MessageComposor from '../message/MessageComposor';
import MessageTimeline from '../message/MessageTimeline';
import EmptyChat from './EmptyChat';

const ChatPane = () => {
  const { user } = useAuth();
  const { selectedConversation } = useConversation();

  const initialPeerReadId =
    selectedConversation?.type === 'direct'
      ? (selectedConversation?.recipientLastReadMessageId ?? null)
      : null;

  const {
    messages,
    sendTextMessage,
    isLoadingHistory,
    peerLastReadMessageId,
    hasMore,
    isLoadingMore,
    loadOlderMessages,
    retryMessage,
  } = useMessages(selectedConversation?.id ?? null, user?.id, initialPeerReadId);

  const { typingUserIds, sendTypingStart, sendTypingStop } = useTypingIndicator(
    selectedConversation?.id ?? null,
    user?.id
  );

  const typingLabel = useMemo(() => {
    if (!selectedConversation || typingUserIds.length === 0) return null;
    if (selectedConversation.type === 'direct') {
      return `${selectedConversation.recipient.name} is typing...`;
    }
    if (typingUserIds.length === 1) {
      return 'Someone is typing...';
    }
    return `${typingUserIds.length} people are typing...`;
  }, [typingUserIds, selectedConversation]);

  if (!selectedConversation) return <EmptyChat />;

  const isDirect = selectedConversation.type === 'direct';
  const title = isDirect
    ? selectedConversation.recipient.name
    : selectedConversation.title || 'Untitled Group';
  const initials = isDirect
    ? selectedConversation.recipient.name
      ? selectedConversation.recipient.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : selectedConversation.recipient.username.slice(0, 2).toUpperCase()
    : 'G';

  console.log(isDirect, selectedConversation);

  return (
    <main className="flex-1 h-full flex flex-col min-w-0">
      <header className="h-13 border-b px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {isDirect ? (
            <div className="relative size-9 border rounded-full font-semibold flex items-center justify-center text-xs shrink-0">
              {initials}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 " />
            </div>
          ) : (
            <div className="size-9 border rounded-full flex items-center justify-center shrink-0">
              <Hash className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">{title}</h2>
            <div className="text-xs text-muted-foreground truncate">Last seen 5 months ago</div>
          </div>
        </div>
      </header>

      {/* Message Timeline Feed */}
      <MessageTimeline
        messages={messages}
        currentUserId={user?.id}
        recipientName={isDirect ? selectedConversation?.recipient.name : undefined}
        peerLastReadMessageId={peerLastReadMessageId}
        hasMore={hasMore}
        isLoadingHistory={isLoadingHistory}
        isLoadingMore={isLoadingMore}
        onLoadOlder={loadOlderMessages}
        onRetryMessage={retryMessage}
      />

      {/* Ephemeral Typing Indicator (ADR-008, Milestone 6.5) */}
      <div className="h-5 px-4 flex items-center gap-2 text-[11px] font-mono text-muted-foreground select-none shrink-0 transition-opacity">
        {typingLabel && (
          <div className="flex items-center gap-1.5 text-muted-foreground animate-fade-in">
            <span className="flex items-center gap-0.5">
              <span
                className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </span>
            <span className="text-[11px] font-mono text-zinc-400 italic">{typingLabel}</span>
          </div>
        )}
      </div>

      {/* Docked Message Composer */}
      <MessageComposor
        placeholder={`Type a message`}
        onSend={sendTextMessage}
        onTyping={sendTypingStart}
        onStopTyping={sendTypingStop}
        disabled={isLoadingHistory}
      />
    </main>
  );
};
export default ChatPane;
