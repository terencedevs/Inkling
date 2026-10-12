import { useEffect, useMemo, useState } from 'react';
import Confetti from '@/components/Confetti';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CHEERS = ['Congratulations', 'Fantastic', 'Brilliant', 'Well done', 'Amazing', 'Wonderful'];

const LINES = {
  All: 'Your very first note is saved. The hardest part is done!',
  Important: 'Your first Important note is in. The big things are in good hands.',
  Casual: 'Your first Casual note is in. Easy does it.',
  Favourite: 'Your first Favourite note is saved. Something worth keeping.',
  Dates: 'Your first date is set. Inkling will keep an eye on it for you.',
};

// Applause for the first note in each section. `sections` is a list like ['All', 'Important', 'Dates'].
export default function Celebration({ sections, name, onClose }) {
  const open = sections.length > 0;
  const [burst, setBurst] = useState(0);
  const cheer = useMemo(() => CHEERS[Math.floor(Math.random() * CHEERS.length)], [sections]);

  useEffect(() => {
    if (open) setBurst((b) => b + 1);
  }, [open]);

  const title = sections.includes('All') ? 'Congratulations' : cheer;

  return (
    <>
      <Confetti burstKey={burst} />
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl text-center sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <div className="text-6xl" aria-hidden="true">
              🎉
            </div>
            <DialogTitle className="font-heading text-2xl">
              {title}, {name || 'friend'}!
            </DialogTitle>
            <DialogDescription>You just hit a first. Here is what you unlocked:</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-left text-sm">
            {sections.map((s) => (
              <li key={s} className="flex gap-2 rounded-2xl bg-muted p-3">
                <span aria-hidden="true">✨</span>
                <span>{LINES[s]}</span>
              </li>
            ))}
          </ul>
          <Button onClick={onClose} className="h-12 rounded-full text-base">
            Keep going
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
