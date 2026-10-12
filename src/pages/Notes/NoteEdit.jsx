import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import PageBand from '@/components/PageBand';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NOTE_FIELDS } from '@/components/noteMeta';
import NoteForm from '@/pages/Notes/NoteForm';

export const route = { path: '/notes/:id/edit', layout: 'owner', access: 'authenticated' };

export default function NoteEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const { data: note, loading, error } = useFetch(async () => {
    const res = await sdk.table('notes_c').select(NOTE_FIELDS).get(id);
    return res.data;
  }, [id]);

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      const res = await sdk.table('notes_c').update({ Id: id, ...payload });
      if (res.messages?.length) {
        toast.error(res.messages[0], { description: res.messages.slice(1).join('\n') || undefined });
      }
      if (!res.data?.length) return;
      toast.success('Changes saved');
      navigate(`/notes/${id}`);
    } finally {
      setSaving(false);
    }
  }

  const back = { to: `/notes/${id}`, label: 'Back to note' };
  const firstLoad = loading && note === undefined;

  return (
    <div>
      <PageBand emoji="✏️" title="Edit note" subtitle={note?.Name} back={back} />
      <div className="mx-auto max-w-3xl px-4 py-6">
        {firstLoad ? (
          <div className="space-y-4">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : error || !note ? (
          <div className="py-16 text-center">
            <p className="font-heading text-xl">We could not find that note</p>
            <p className="mt-1 text-sm text-muted-foreground">It may have been deleted.</p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/">Back to Notes</Link>
            </Button>
          </div>
        ) : (
          <NoteForm initial={note} onSubmit={handleSubmit} saving={saving} submitLabel="Save changes" cancelTo={`/notes/${id}`} />
        )}
      </div>
    </div>
  );
}
