import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Chat = () => {
  const { user, logout } = useAuth();
  return (
    <div>
      Chat
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <Button onClick={logout}>logout</Button>
    </div>
  );
};

export default Chat;
