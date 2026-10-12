import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';

// Full-bleed colour band at the top of every page: title on the left, one primary action on the right.
// Pages below the top level pass `back` so the user never depends on the browser back button.
export default function PageBand({ title, subtitle, emoji, action, back, children }) {
  return (
    <section className="w-full bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {back && (
          <Link
            to={back.to}
            className="mb-3 inline-flex h-10 items-center gap-1 rounded-full pr-3 text-sm font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ApperIcon name="ArrowLeft" size={16} />
            {back.label}
          </Link>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl md:text-3xl">
              {emoji && <span aria-hidden="true">{emoji} </span>}
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm opacity-80">{subtitle}</p>}
          </div>
          {action}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </section>
  );
}
