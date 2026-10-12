import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/layouts/RootLayout';
import ApperIcon from '@/components/ApperIcon';
import Celebration from '@/components/Celebration';
import PageBand from '@/components/PageBand';
import { useNickname, greetingFor } from '@/components/useNickname';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { MARKS, NOTE_FIELDS, toCreatePayload } from '@/components/noteMeta';
import NoteCard from '@/pages/Notes/NoteCard';

export const route = { path: '/', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'StickyNote', label: 'Notes', order: 10, profiles: null };

const { eq, or, and, contains } = window.ApperSDK.CoreSDK;

const TABS = ['All', ...MARKS];

async function fetchCounts() {
  const count = (id, where) => ({
    id,
    fields: [{ field: 'Id', fn: 'Count', alias: 'count' }],
    ...(where ? { where } : {}),
  });
  const res = await sdk
    .table('notes_c')
    .select([{ field: 'Id' }])
    .aggregate([
      count('all'),
      count('important', eq('mark_c', 'Important')),
      count('casual', eq('mark_c', 'Casual')),
      count('favourite', eq('mark_c', 'Favourite')),
    ])
    .limit(1)
    .fetch();
  if (!res.success) throw new Error(res.message);
  const agg = (id) => {
    const b = res.aggregators?.find((a) => a.id === id);
    return b?.data?.count ?? b?.count ?? b?.value ?? 0;
  };
  return { All: agg('all'), Important: agg('important'), Casual: agg('casual'), Favourite: agg('favourite') };
}

export default function Home() {
  const { user } = useAuth();
  const { name } = useNickname();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [celebrate, setCelebrate] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // The editor sends us here with the sections that just got their first note.
  useEffect(() => {
    const list = location.state?.celebrate;
    if (list?.length) {
      setCelebrate(list);
      navigate('/', { replace: true, state: null });
    }
  }, [location.state]);

  const { data: notes, loading, error, run, setData } = useFetch(() => {
    const f = [];
    if (tab !== 'All') f.push(eq('mark_c', tab));
    if (debounced) f.push(or(contains('Name', debounced), contains('body_c', debounced)));
    let q = sdk.table('notes_c').select(NOTE_FIELDS);
    if (f.length) q = q.where(and(...f));
    return q
      .orderByDesc('ModifiedOn')
      .page(1, 60)
      .fetch()
      .then((r) => {
        if (!r.success) throw new Error(r.message);
        return r.data;
      });
  }, [tab, debounced]);

  const { data: counts, run: refetchCounts } = useFetch(fetchCounts, []);

  const { data: me } = useFetch(async () => {
    const r = await sdk.admin.get('user', user.userId);
    return r?.data ?? r;
  }, [user?.userId]);
  const hidePreviews = Boolean(me?.hidePreviews_c);

  const rows = notes ?? [];
  const pinned = rows.filter((n) => n.isPinned_c);
  const others = rows.filter((n) => !n.isPinned_c);
  const firstLoad = loading && notes === undefined;
  const noNotesAtAll = counts && counts.All === 0;

  function refresh() {
    run();
    refetchCounts();
  }

  // Optimistic update: the card moves or changes at once, and reverts with a toast on failure.
  async function patchNote(note, fields, message) {
    setData((prev) => (prev ?? []).map((n) => (n.Id === note.Id ? { ...n, ...fields } : n)));
    const res = await sdk.table('notes_c').update({ Id: note.Id, ...fields });
    if (res.messages?.length || !res.data?.length) {
      toast.error(res.messages?.[0] ?? 'Could not save that change');
      run();
      return;
    }
    if (message) toast.success(message);
    refresh();
  }

  function toggleFavourite(note) {
    const next = note.mark_c === 'Favourite' ? 'Casual' : 'Favourite';
    if (next === 'Favourite' && (counts?.Favourite ?? 0) === 0) setCelebrate(['Favourite']);
    patchNote(note, { mark_c: next }, next === 'Favourite' ? 'Added to Favourites' : 'Moved to Casual');
  }

  function togglePin(note) {
    patchNote(note, { isPinned_c: !note.isPinned_c }, note.isPinned_c ? 'Unpinned' : 'Pinned to the top');
  }

  async function deleteNote(note) {
    const res = await sdk.table('notes_c').remove([note.Id]);
    if (!res.success) {
      toast.error(res.messages?.[0] ?? 'Could not delete that note');
      return;
    }
    refresh();
    toast(`Deleted "${note.Name}"`, {
      action: {
        label: 'Undo',
        onClick: async () => {
          const created = await sdk.table('notes_c').create(toCreatePayload(note));
          if (created.data?.length) {
            toast.success('Note restored');
            refresh();
          } else {
            toast.error(created.messages?.[0] ?? 'Could not restore the note');
          }
        },
      },
    });
  }

  function renderGrid(list) {
    return (
      <div className="columns-2 gap-3">
        <AnimatePresence mode="popLayout">
          {list.map((note) => (
            <motion.div
              key={note.Id}
              layout="position"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="mb-3 break-inside-avoid"
            >
              <NoteCard
                record={note}
                hidePreviews={hidePreviews}
                onToggleFavourite={toggleFavourite}
                onTogglePin={togglePin}
                onDelete={deleteNote}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  function renderEmpty() {
    if (debounced) {
      return { emoji: '🔍', title: 'No notes match that search', text: 'Try a different word.', cta: false };
    }
    if (noNotesAtAll) {
      return { emoji: '🌱', title: 'Add your First Note', text: 'Tap New note and write the first thing on your mind.', cta: true };
    }
    if (tab !== 'All' && counts?.[tab] === 0) {
      return { emoji: '✨', title: `Add your first ${tab} note`, text: 'Your first one in this section gets a little celebration.', cta: true };
    }
    return { emoji: '📝', title: 'Nothing here yet', text: 'Notes you add will show up here.', cta: true };
  }

  const empty = renderEmpty();
  const markParam = tab !== 'All' && !noNotesAtAll ? `?mark=${tab}` : '';

  return (
    <div>
      <Celebration sections={celebrate} name={name} onClose={() => setCelebrate([])} />
      <PageBand title={greetingFor('notes', name)} emoji="🪶">
        <div className="space-y-3">
          <div className="relative">
            <ApperIcon name="Search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your notes…"
              aria-label="Search notes"
              className="h-12 rounded-full border-0 bg-background pl-11 shadow-(--shadow-sm)"
            />
          </div>
          <div role="tablist" aria-label="Note categories" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  tab === t ? 'bg-background text-foreground shadow-(--shadow-sm)' : 'bg-background/25 text-primary-foreground hover:bg-background/40'
                )}
              >
                {t}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{counts?.[t] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </PageBand>

      <div className="px-4 py-5">
        {error ? (
          <div className="rounded-3xl border border-border p-8 text-center">
            <p className="font-heading text-lg">Your notes did not load</p>
            <p className="mt-1 text-sm text-muted-foreground">{error.message ?? 'Something went wrong.'}</p>
            <Button className="mt-4 rounded-full" onClick={refresh}>
              Try again
            </Button>
          </div>
        ) : firstLoad ? (
          <div className="columns-2 gap-3">
            {['h-44', 'h-32', 'h-52', 'h-36', 'h-48', 'h-40'].map((h, i) => (
              <Skeleton key={i} className={cn('mb-3 w-full break-inside-avoid rounded-3xl', h)} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="mx-auto max-w-xs py-12 text-center">
            <div className="text-6xl" aria-hidden="true">
              {empty.emoji}
            </div>
            <p className="mt-4 font-heading text-2xl">{empty.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{empty.text}</p>
            {empty.cta && (
              <Button asChild className="mt-5 h-12 rounded-full px-6">
                <Link to={`/notes/new${markParam}`}>
                  <ApperIcon name="Plus" size={18} /> Write a note
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div aria-busy={loading} className={cn('space-y-6 transition-opacity', loading && 'pointer-events-none opacity-60')}>
            {pinned.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <ApperIcon name="Pin" size={14} /> Pinned
                </h2>
                {renderGrid(pinned)}
              </section>
            )}
            {others.length > 0 && (
              <section>
                {pinned.length > 0 && (
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Everything else</h2>
                )}
                {renderGrid(others)}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
