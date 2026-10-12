import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const CATEGORIES = {
  Faces: [
    ['😀', 'smile happy grin'],
    ['😊', 'blush happy warm'],
    ['😍', 'love heart eyes'],
    ['🤔', 'think hmm idea'],
    ['😴', 'sleep tired rest'],
    ['🥳', 'party celebrate'],
    ['😎', 'cool sunglasses'],
    ['🥲', 'tear grateful'],
  ],
  Food: [
    ['🥞', 'pancake breakfast recipe'],
    ['🍕', 'pizza dinner'],
    ['🍰', 'cake dessert'],
    ['☕', 'coffee tea chai'],
    ['🍎', 'apple fruit'],
    ['🛒', 'grocery shopping cart'],
    ['🍜', 'noodles ramen soup'],
    ['🍫', 'chocolate sweet'],
  ],
  Nature: [
    ['🌧️', 'rain monsoon weather'],
    ['🌞', 'sun sunny day'],
    ['🌸', 'flower blossom spring'],
    ['🪴', 'plant water garden'],
    ['🌈', 'rainbow'],
    ['🌙', 'moon night'],
    ['🐶', 'dog pet puppy'],
    ['🐱', 'cat pet kitten'],
  ],
  Things: [
    ['📝', 'note memo write'],
    ['📚', 'books study exam school'],
    ['💡', 'idea bulb bill electricity'],
    ['🧳', 'trip luggage travel packing'],
    ['🎂', 'birthday cake party'],
    ['🦷', 'dentist tooth health'],
    ['💼', 'work office job'],
    ['🎁', 'gift present'],
    ['🛂', 'passport travel document'],
    ['✏️', 'pencil write'],
    ['🎧', 'music headphones'],
    ['🏠', 'home house'],
  ],
  Symbols: [
    ['⭐', 'star favourite'],
    ['❤️', 'heart love'],
    ['✅', 'done check complete'],
    ['🔥', 'fire important urgent'],
    ['⏰', 'alarm clock time reminder'],
    ['💰', 'money bill pay'],
    ['🎯', 'goal target'],
    ['✨', 'sparkle magic'],
  ],
};

const RECENT_KEY = 'inkling-recent-emoji';

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // storage can be unavailable; recents just won't persist
  }
}

// Searchable emoji picker with categories and recently used.
export default function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Things');
  const [recent, setRecent] = useState(loadRecent);

  const all = Object.values(CATEGORIES).flat();
  const q = query.trim().toLowerCase();
  const visible = q ? all.filter(([, keywords]) => keywords.includes(q)) : CATEGORIES[category];

  function pick(emoji) {
    const next = [emoji, ...recent.filter((e) => e !== emoji)].slice(0, 8);
    setRecent(next);
    saveRecent(next);
    onChange(emoji);
    setOpen(false);
    setQuery('');
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Choose an emoji for this note"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-input bg-muted text-3xl transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          {value || '📝'}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3 p-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search: birthday, rain, pay…"
          aria-label="Search emoji"
          autoFocus
        />
        {!q && recent.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Recently used</p>
            <div className="flex flex-wrap gap-1">
              {recent.map((emoji) => (
                <button
                  key={`recent-${emoji}`}
                  type="button"
                  onClick={() => pick(emoji)}
                  className="h-10 w-10 rounded-lg text-xl hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        {!q && (
          <div className="flex gap-1 overflow-x-auto">
            {Object.keys(CATEGORIES).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                className={cn(
                  'h-8 shrink-0 rounded-full px-3 text-xs font-semibold',
                  category === name ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent'
                )}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {visible.map(([emoji]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => pick(emoji)}
              className="h-10 w-10 rounded-lg text-xl hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              {emoji}
            </button>
          ))}
          {visible.length === 0 && <p className="text-sm text-muted-foreground">No emoji match that. Try another word.</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
