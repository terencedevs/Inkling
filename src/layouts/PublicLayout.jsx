import { Outlet } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

export default function PublicLayout() {
  return (
    <div className="min-h-svh bg-background relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Outlet />
    </div>
  );
}
