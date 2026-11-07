import AppHeader from '@/components/AppHeader';
import ChatPane from '@/pages/Chat/ChatPane';
import ConversationSidebar from '@/pages/Chat/ConversationSidebar';
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
