import { createRoot } from 'react-dom/client';

import './index.css';
import { ThemeProvider } from '@/providers/ThemeProvider.tsx';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}
