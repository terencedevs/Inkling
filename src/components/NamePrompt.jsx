import { useState } from 'react';
import { toast } from 'sonner';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Shown on first launch, and only until a name is saved. It cannot be dismissed without one.
export default function NamePrompt({ open, onSave }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    setSaving(true);
    try {
      await onSave(name);
      toast.success(`Nice to meet you, ${name}!`);
    } catch (err) {
      toast.error(err.message ?? 'Could not save your name');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-[calc(100vw-2rem)] rounded-3xl sm:max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="items-center text-center">
            <div className="text-5xl" aria-hidden="true">
              👋
            </div>
            <DialogTitle className="font-heading text-2xl">Hi! What should we call you?</DialogTitle>
            <DialogDescription>Add your name and Inkling will greet you with it every time you visit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="nickname">Your name</Label>
            <Input
              id="nickname"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type your name, like Aarav"
              maxLength={30}
              autoFocus
              autoComplete="given-name"
              className="h-12 text-base"
            />
          </div>
          <Button type="submit" disabled={saving || !value.trim()} className="h-12 w-full rounded-full text-base">
            {saving ? (
              <>
                <ApperIcon name="LoaderCircle" size={16} className="animate-spin" /> Saving…
              </>
            ) : (
              "Let's go"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
