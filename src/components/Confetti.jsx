import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-highlight'];

// A short confetti burst. Change `burstKey` to fire it again; it stays hidden while the key is 0.
export default function Confetti({ burstKey }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 560,
        y: -(80 + Math.random() * 240),
        rotate: Math.random() * 540 - 270,
        color: COLORS[i % COLORS.length],
      })),
    [burstKey]
  );

  if (!burstKey) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-(--z-toast) flex items-center justify-center motion-reduce:hidden">
      {pieces.map((p) => (
        <motion.span
          key={`${burstKey}-${p.id}`}
          className={`absolute h-3 w-2 rounded-sm ${p.color}`}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y + 420, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
