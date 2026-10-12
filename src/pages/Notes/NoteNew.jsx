import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import PageBand from '@/components/PageBand';
import { MARKS } from '@/components/noteMeta';
import NoteForm from '@/pages/Notes/NoteForm';

export const route = { path: '/notes/new', layout: 'owner', access: 'authenticated' };

const { eq } = window.ApperSDK.CoreSDK;

// Works out which sections this note is the very first in, so Home can celebrate.
async function findFirsts(payload) {
  try {
    const count = (id, where) => ({
      id,
      fields: [{ field: 'Id', fn: 'Count', alias: 'count' }],
      ...(where ? { where } : {}),
    });
    const aggs = [count('all'), count('mark', eq('mark_c', payload.mark_c))];
    if (payload.isDated_c) aggs.push(count('dated', eq('isDated_c', true)));
    const res = await sdk.table('notes_c').select([{ field: 'Id' }]).aggregate(aggs).limit(1).fetch();
    if (!res.success) return [];
    const agg = (id) => {
      const b = res.aggregators?.find((a) => a.id === id);
      return b?.data?.count ?? b?.count ?? b?.value ?? 0;
    };
    const firsts = [];
    if (agg('all') === 0) firsts.push('All');
    if (agg('mark') === 0) firsts.push(payload.mark_c);
    if (payload.isDated_c && agg('dated') === 0) firsts.push('Dates');
    return firsts;
  } catch {
    return [];
  }
}

export default function NoteNew() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const presetMark = MARKS.includes(params.get('mark')) ? params.get('mark') : null;

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      const firsts = await findFirsts(payload);
      const res = await sdk.table('notes_c').create(payload);
      if (res.messages?.length) {
        toast.error(res.messages[0], { description: res.messages.slice(1).join('\n') || undefined });
      }
      if (!res.data?.length) return;
      toast.success('Note saved');
      navigate('/', { state: { celebrate: firsts } });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageBand emoji="✍️" title="New note" subtitle="Quick and quiet. Write now, tidy later." back={{ to: '/', label: 'Back to Notes' }} />
      <div className="px-4 py-5">
        <NoteForm initial={presetMark ? { mark_c: presetMark } : undefined} onSubmit={handleSubmit} saving={saving} submitLabel="Save note" cancelTo="/" />
      </div>
    </div>
  );
}
