import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from '@/router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton duration={3000} />
      </TooltipProvider>
    </ThemeProvider>
  );
}
