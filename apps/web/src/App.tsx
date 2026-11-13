import { BrowserRouter } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './providers/AuthProvider';
import { SocketProvider } from './providers/SocketProvider';
import AppRoutes from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-center" duration={3000} />
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
