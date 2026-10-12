import { useState } from 'react';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/layouts/RootLayout';
import ApperIcon from '@/components/ApperIcon';
import PageBand from '@/components/PageBand';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NOTE_FIELDS } from '@/components/noteMeta';

export const route = { path: '/settings', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'Settings', label: 'Settings', order: 40, profiles: null };

const FREQUENCIES = ['Daily', 'A few times a week', 'Weekly'];

function Row({ id, title, text, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-base">
          {title}
        </Label>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data: me, loading, error, run, setData } = useFetch(async () => {
    const r = await sdk.admin.get('user', user.userId);
    return r?.data ?? r;
  }, [user?.userId]);

  const firstLoad = loading && me === undefined;

  // Quick toggles feel instant and revert with a toast if the save fails.
  async function save(fields, message) {
    setData((prev) => ({ ...(prev ?? {}), ...fields }));
    try {
      const res = await sdk.admin.update('user', { Id: user.userId, ...fields });
      if (res?.success === false) throw new Error(res.message);
      toast.success(message);
    } catch (e) {
      toast.error(e.message ?? 'Could not save that setting');
      run();
    }
  }

  async function exportNotes() {
    setExporting(true);
    try {
      const res = await sdk.table('notes_c').select(NOTE_FIELDS).page(1, 200).fetch();
      if (!res.success) throw new Error(res.message);
      const blob = new Blob([JSON.stringify({ app: 'Inkling', exportedAt: new Date().toISOString(), notes: res.data }, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'inkling-backup.json';
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.data.length} notes`);
    } catch (e) {
      toast.error(e.message ?? 'Could not export your notes');
    } finally {
      setExporting(false);
    }
  }

  async function deleteAll() {
    setWiping(true);
    try {
      const res = await sdk.table('notes_c').select(['Name']).page(1, 200).fetch();
      if (!res.success) throw new Error(res.message);
      const ids = res.data.map((n) => n.Id);
      if (ids.length) {
        const removed = await sdk.table('notes_c').remove(ids);
        if (!removed.success && !removed.data?.length) throw new Error(removed.messages?.[0] ?? 'Could not delete');
      }
      toast.success('All notes deleted');
      setConfirmOpen(false);
    } catch (e) {
      toast.error(e.message ?? 'Could not delete your notes');
    } finally {
      setWiping(false);
    }
  }

  return (
    <div>
      <PageBand emoji="⚙️" title="Settings" subtitle="Make Inkling feel like yours. Light or dark lives in the menu at the top right." />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <section className="flex gap-4 rounded-2xl bg-secondary p-5 text-secondary-foreground">
          <span className="text-3xl" aria-hidden="true">
            🔒
          </span>
          <div>
            <h2 className="font-heading text-lg">Your notes stay on your phone</h2>
            <p className="mt-1 text-sm">
              The Android app keeps every note in private storage on the device, with no account, no analytics and no internet permission. This web preview keeps its demo
              notes in the Apper cloud so you can try the design.
            </p>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-border p-8 text-center">
            <p className="font-heading text-lg">Settings did not load</p>
            <Button className="mt-3" onClick={run}>
              Try again
            </Button>
          </div>
        ) : firstLoad ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            <section className="divide-y divide-border rounded-2xl border border-border px-5">
              <h2 className="pt-4 font-heading text-lg">Gentle nudges</h2>
              <Row id="nudges" title="Send me nudges" text="A warm reminder now and then, never more than two a day.">
                <Switch id="nudges" checked={Boolean(me?.nudges_c)} onCheckedChange={(v) => save({ nudges_c: v }, v ? 'Nudges are on' : 'Nudges are off')} />
              </Row>
              <Row id="frequency" title="How often" text="Pick the pace that feels friendly.">
                <Select value={me?.nudgeFrequency_c ?? 'A few times a week'} onValueChange={(v) => save({ nudgeFrequency_c: v }, 'Frequency updated')} disabled={!me?.nudges_c}>
                  <SelectTrigger id="frequency" className="w-48">
                    <SelectValue placeholder="Choose how often" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
            </section>

            <section className="divide-y divide-border rounded-2xl border border-border px-5">
              <h2 className="pt-4 font-heading text-lg">Privacy</h2>
              <Row id="previews" title="Hide note previews" text="Cards show only the title and emoji, so a glance over your shoulder reveals nothing.">
                <Switch
                  id="previews"
                  checked={Boolean(me?.hidePreviews_c)}
                  onCheckedChange={(v) => save({ hidePreviews_c: v }, v ? 'Previews hidden' : 'Previews shown')}
                />
              </Row>
            </section>

            <section className="space-y-4 rounded-2xl border border-border p-5">
              <h2 className="font-heading text-lg">Backup and data</h2>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-full" disabled={exporting} onClick={exportNotes}>
                  <ApperIcon name="Download" size={16} /> {exporting ? 'Exporting…' : 'Export all notes'}
                </Button>
                <Button variant="ghost" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmOpen(true)}>
                  <ApperIcon name="Trash2" size={16} /> Delete all data
                </Button>
              </div>
            </section>
          </>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all notes?</AlertDialogTitle>
            <AlertDialogDescription>Every note and reminder will be removed. Export a backup first if you might want them back.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my notes</AlertDialogCancel>
            <AlertDialogAction
              disabled={wiping}
              onClick={(e) => {
                e.preventDefault();
                deleteAll();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {wiping ? 'Deleting…' : 'Delete everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
