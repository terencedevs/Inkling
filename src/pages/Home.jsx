import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/layouts/RootLayout';
import ApperIcon from '@/components/ApperIcon';
import PageBand from '@/components/PageBand';
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

const EMPTY_COPY = {
  All: 'No notes yet. What is on your mind?',
  Important: 'Nothing marked Important. Lucky you.',
  Casual: 'No casual notes yet. Jot down something easy.',
  Favourite: 'No favourites yet. Tap the star on any note.',
};

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
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

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
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        <AnimatePresence mode="popLayout">
          {list.map((note) => (
            <motion.div
              key={note.Id}
              layout="position"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="mb-4 break-inside-avoid"
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

  return (
    <div>
      <PageBand
        emoji="🪶"
        title="Your notes"
        subtitle="Everything you have jotted down, sorted by how much it matters."
        action={
          <Button asChild className="h-11 rounded-full bg-highlight px-5 text-highlight-foreground hover:bg-highlight/90">
            <Link to="/notes/new">
              <ApperIcon name="Plus" size={18} /> New note
            </Link>
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <ApperIcon name="Search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles and notes…"
              aria-label="Search notes"
              className="h-11 rounded-full bg-background pl-10"
            />
          </div>
          <div role="tablist" aria-label="Note categories" className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring',
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

      <div className="mx-auto max-w-6xl px-4 py-6">
        {error ? (
          <div className="rounded-2xl border border-border p-8 text-center">
            <p className="font-heading text-lg">Your notes did not load</p>
            <p className="mt-1 text-sm text-muted-foreground">{error.message ?? 'Something went wrong.'}</p>
            <Button className="mt-4" onClick={refresh}>
              Try again
            </Button>
          </div>
        ) : firstLoad ? (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {[44, 32, 52, 36, 48, 40].map((h, i) => (
              <Skeleton key={i} className="mb-4 w-full break-inside-avoid rounded-2xl" style={{ height: `${h * 4}px` }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="mx-auto max-w-sm py-16 text-center">
            <div className="text-6xl" aria-hidden="true">
              🌱
            </div>
            <p className="mt-4 font-heading text-xl">{debounced ? 'No notes match that search' : EMPTY_COPY[tab]}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {debounced ? 'Try a different word.' : 'Tap New note and let the words out.'}
            </p>
            {!debounced && (
              <Button asChild className="mt-5 rounded-full">
                <Link to="/notes/new">Write your first note</Link>
              </Button>
            )}
          </div>
        ) : (
          <div aria-busy={loading} className={cn('space-y-8 transition-opacity', loading && 'pointer-events-none opacity-60')}>
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
