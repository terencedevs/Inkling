import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';

// The colour header under the app bar: a big friendly title, then optional controls.
// Pages below the top level pass `back` so the user never depends on the browser back button.
export default function PageBand({ title, subtitle, emoji, action, back, children }) {
  return (
    <section className="rounded-b-[2rem] bg-primary px-5 pb-5 pt-1 text-primary-foreground">
      {back && (
        <Link
          to={back.to}
          className="mb-2 inline-flex h-10 items-center gap-1 rounded-full pr-3 text-sm font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ApperIcon name="ArrowLeft" size={16} />
          {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl leading-tight">
            {emoji && <span aria-hidden="true">{emoji} </span>}
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm opacity-80">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}
