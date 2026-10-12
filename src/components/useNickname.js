import { useCallback, useEffect, useState } from 'react';
import { sdk } from '@/services/sdk';
import { useAuth } from '@/layouts/RootLayout';

const EVENT = 'inkling:nickname';

// Reads and saves the name the user gave on first launch. All screens share it through a window event,
// so saving it in Settings updates every greeting at once.
export function useNickname() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, name: '' });

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await sdk.admin.get('user', user.userId);
        const me = r?.data ?? r;
        if (alive) setState({ loading: false, name: (me?.nickname_c ?? '').trim() });
      } catch {
        if (alive) setState({ loading: false, name: '' });
      }
    }
    load();
    const onChange = (e) => setState({ loading: false, name: e.detail });
    window.addEventListener(EVENT, onChange);
    return () => {
      alive = false;
      window.removeEventListener(EVENT, onChange);
    };
  }, [user?.userId]);

  const save = useCallback(
    async (name) => {
      const res = await sdk.admin.update('user', { Id: user.userId, nickname_c: name });
      if (res?.success === false) throw new Error(res.message ?? 'Could not save your name');
      window.dispatchEvent(new CustomEvent(EVENT, { detail: name }));
    },
    [user?.userId]
  );

  return { loading: state.loading, name: state.name, save };
}

const LINES = {
  notes: ['What do you need today, {n}?', "What's on the menu, {n}?", "What's on your mind, {n}?"],
  dates: ["What's coming up, {n}?", 'Anything to remember, {n}?'],
  calendar: ["What's the plan, {n}?", 'Which day shall we look at, {n}?'],
  settings: ['Make it yours, {n}', 'Tune things up, {n}'],
};

// A friendly line that changes through the day but stays steady while you use a screen.
export function greetingFor(section, name) {
  const list = LINES[section] ?? LINES.notes;
  const now = new Date();
  const pick = list[(now.getDate() + now.getHours()) % list.length];
  return pick.replace('{n}', name || 'friend');
}

export function useGreeting(section) {
  const { name } = useNickname();
  return greetingFor(section, name);
}
