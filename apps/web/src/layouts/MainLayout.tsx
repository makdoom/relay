import AppHeader from '@/components/AppHeader';
import Chat from '@/pages/Chat';
import { ConversationProvider } from '@/providers/ConversationProvider';

const MainLayout = () => {
  return (
    <ConversationProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden antialiased">
        <AppHeader />
        <Chat />
      </div>
    </ConversationProvider>
  );
};

export default MainLayout;
