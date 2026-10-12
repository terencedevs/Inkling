import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import PageBand from '@/components/PageBand';
import NoteForm from '@/pages/Notes/NoteForm';

export const route = { path: '/notes/new', layout: 'owner', access: 'authenticated' };

export default function NoteNew() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      const res = await sdk.table('notes_c').create(payload);
      if (res.messages?.length) {
        toast.error(res.messages[0], { description: res.messages.slice(1).join('\n') || undefined });
      }
      if (!res.data?.length) return;
      toast.success('Note saved');
      navigate('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageBand emoji="✍️" title="New note" subtitle="Quick and quiet. Write now, tidy later." back={{ to: '/', label: 'Back to Notes' }} />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <NoteForm onSubmit={handleSubmit} saving={saving} submitLabel="Save note" cancelTo="/" />
      </div>
    </div>
  );
}
