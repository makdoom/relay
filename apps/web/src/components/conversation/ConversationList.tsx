import { useConversation } from '@/hooks/useConversation';
import type { ConversationFilter } from '@/types/conversation';
import ConversationItem from './ConversationItem';

const ConversationList = ({ type }: { type: ConversationFilter }) => {
  let { filteredConversations } = useConversation();

  switch (type) {
    case 'all':
      filteredConversations = [...filteredConversations];
      break;
    case 'direct':
      filteredConversations = filteredConversations.filter((item) => item.type === type);
      break;
    case 'group':
      filteredConversations = filteredConversations.filter((item) => item.type === type);
      break;
    case 'unread':
      filteredConversations = [...filteredConversations];
      break;
    default:
      break;
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto">
      {filteredConversations.map((conversation) => (
        <ConversationItem key={conversation.id} conversation={conversation} />
      ))}
    </div>
  );
};
export default ConversationList;
