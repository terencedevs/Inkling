import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'light',  Icon: Sun,     label: 'Light mode' },
  { value: 'dark',   Icon: Moon,    label: 'Dark mode' },
  { value: 'system', Icon: Monitor, label: 'System theme' },
];

export default function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn('flex items-center gap-0 rounded-lg border border-input p-0.5', className)}>
      {OPTIONS.map(({ value, Icon, label }) => (
        <Toggle
          key={value}
          size="sm"
          pressed={theme === value}
          onPressedChange={() => setTheme(value)}
          aria-label={label}
        >
          <Icon />
        </Toggle>
      ))}
    </div>
  );
}
