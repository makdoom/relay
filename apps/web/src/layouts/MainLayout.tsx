import ChatPane from '@/components/chat/ChatPane';
import ConversationSidebar from '@/components/conversation/ConversationSidebar';
import AppHeader from '@/layouts/AppHeader';
import { ConversationProvider } from '@/providers/ConversationProvider';

const MainLayout = () => {
  return (
    <ConversationProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden antialiased">
        <AppHeader />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <ConversationSidebar />
          <ChatPane />
        </div>
      </div>
    </ConversationProvider>
  );
};

export default MainLayout;
