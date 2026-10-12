import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';
import EmojiPicker from '@/components/EmojiPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  MARKS,
  COLORS,
  REPEATS,
  REMINDER_OPTIONS,
  MARK_STYLE,
  SWATCH_CLASS,
  toArray,
  toLocalInput,
  fromLocalInput,
} from '@/components/noteMeta';

function tomorrowMorning() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toLocalInput(d.toISOString());
}

// Shared by the create and edit pages. A distraction-free editor with a small formatting toolbar.
export default function NoteForm({ initial, onSubmit, saving, submitLabel, cancelTo }) {
  const init = initial ?? {};
  const bodyRef = useRef(null);
  const [title, setTitle] = useState(init.Name ?? '');
  const [body, setBody] = useState(init.body_c ?? '');
  const [mark, setMark] = useState(init.mark_c ?? 'Casual');
  const [emoji, setEmoji] = useState(init.emoji_c || '📝');
  const [color, setColor] = useState(init.color_c ?? 'Default');
  const [pinned, setPinned] = useState(Boolean(init.isPinned_c));
  const [dated, setDated] = useState(Boolean(init.isDated_c));
  const [due, setDue] = useState(toLocalInput(init.dueAt_c));
  const [repeat, setRepeat] = useState(init.repeat_c ?? 'None');
  const [reminders, setReminders] = useState(toArray(init.reminders_c));
  const [touched, setTouched] = useState(false);

  const titleError = touched && !title.trim();
  const dueError = touched && dated && !due;

  function format(kind) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    let next;
    let caret;
    if (kind === 'bold') {
      const selected = body.slice(start, end) || 'bold text';
      next = `${body.slice(0, start)}**${selected}**${body.slice(end)}`;
      caret = start + selected.length + 4;
    } else {
      const prefix = kind === 'bullet' ? '- ' : '- [ ] ';
      const lineStart = start === 0 ? 0 : body.lastIndexOf('\n', start - 1) + 1;
      next = `${body.slice(0, lineStart)}${prefix}${body.slice(lineStart)}`;
      caret = start + prefix.length;
    }
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  function toggleReminder(option, checked) {
    setReminders((prev) => (checked ? [...prev, option] : prev.filter((r) => r !== option)));
  }

  function handleDated(checked) {
    setDated(checked);
    if (checked && !due) setDue(tomorrowMorning());
    if (checked && reminders.length === 0) setReminders(['1 day before']);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!title.trim() || (dated && !due)) return;
    onSubmit({
      Name: title.trim(),
      body_c: body,
      mark_c: mark,
      emoji_c: emoji,
      color_c: color,
      isPinned_c: pinned,
      isDated_c: dated,
      dueAt_c: dated ? fromLocalInput(due) : null,
      repeat_c: dated ? repeat : 'None',
      reminders_c: dated ? reminders.join(',') : '',
      isDone_c: Boolean(init.isDone_c),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Mum's birthday, Grocery run, Poem idea…"
              aria-invalid={titleError}
              autoFocus
              className="h-14 text-lg"
            />
            {titleError && <p className="text-sm text-destructive">Give your note a title so you can find it later.</p>}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="note-body">Note</Label>
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => format('bold')} aria-label="Bold" className="h-10 w-10 p-0">
                <ApperIcon name="Bold" size={16} />
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => format('bullet')} aria-label="Bulleted list" className="h-10 w-10 p-0">
                <ApperIcon name="List" size={16} />
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => format('check')} aria-label="Checklist" className="h-10 w-10 p-0">
                <ApperIcon name="ListChecks" size={16} />
              </Button>
            </div>
          </div>
          <Textarea
            id="note-body"
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={'What is on your mind? Use the buttons above for bold, bullets and checklists.'}
            rows={9}
            className="text-base"
          />
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <Label>Mark</Label>
          <div role="radiogroup" aria-label="Mark" className="flex flex-wrap gap-2">
            {MARKS.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mark === m}
                onClick={() => setMark(m)}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  mark === m ? cn(MARK_STYLE[m].chip, 'border-foreground/30') : 'border-input bg-background hover:bg-accent'
                )}
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', MARK_STYLE[m].dot)} />
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Card colour</Label>
          <div role="radiogroup" aria-label="Card colour" className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={c}
                onClick={() => setColor(c)}
                className={cn(
                  'h-10 w-10 rounded-full transition-transform focus-visible:ring-2 focus-visible:ring-ring',
                  SWATCH_CLASS[c],
                  color === c && 'scale-110 ring-2 ring-foreground'
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border p-4">
          <div>
            <Label htmlFor="note-pinned">Pin to the top</Label>
            <p className="text-sm text-muted-foreground">Pinned notes stay above everything else.</p>
          </div>
          <Switch id="note-pinned" checked={pinned} onCheckedChange={setPinned} />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="note-dated">Tie this note to a date</Label>
            <p className="text-sm text-muted-foreground">Birthdays, exams, bills, trips. It shows up under Dates and the calendar.</p>
          </div>
          <Switch id="note-dated" checked={dated} onCheckedChange={handleDated} />
        </div>

        {dated && (
          <div className="space-y-5 border-t border-border pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="note-due">Date and time</Label>
                <Input id="note-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} aria-invalid={dueError} />
                {dueError && <p className="text-sm text-destructive">Pick a date and time.</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="note-repeat">Repeat</Label>
                <Select value={repeat} onValueChange={setRepeat}>
                  <SelectTrigger id="note-repeat">
                    <SelectValue placeholder="Does not repeat" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPEATS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r === 'None' ? 'Does not repeat' : r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">Remind me</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {REMINDER_OPTIONS.map((option) => (
                  <label key={option} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border border-input px-3 hover:bg-accent">
                    <Checkbox checked={reminders.includes(option)} onCheckedChange={(checked) => toggleReminder(option, Boolean(checked))} />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" asChild>
          <Link to={cancelTo}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={saving} className="bg-highlight text-highlight-foreground hover:bg-highlight/90">
          {saving ? (
            <>
              <ApperIcon name="LoaderCircle" size={16} className="animate-spin" /> Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
