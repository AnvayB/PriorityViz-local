import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import Home from '@/pages/Home';

function App() {
  return (
    <ThemeProvider>
      <Home />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
