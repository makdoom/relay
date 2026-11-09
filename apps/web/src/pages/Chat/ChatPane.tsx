import { useConversation } from '@/hooks/useConversation';

const ChatPane = () => {
  const { selectedConversation } = useConversation();
  console.log(selectedConversation);

  return <div>ChatPane</div>;
};

export default ChatPane;
