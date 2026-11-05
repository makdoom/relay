import { BrowserRouter } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './providers/AuthProvider';
import AppRoutes from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" duration={3000} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
