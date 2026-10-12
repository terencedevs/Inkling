// Full-bleed colour band at the top of every page: title on the left, one primary action on the right.
export default function PageBand({ title, subtitle, emoji, action, children }) {
  return (
    <section className="w-full bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-6 md:py-8">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl md:text-3xl">
            {emoji && <span aria-hidden="true">{emoji} </span>}
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm opacity-80">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children && <div className="mx-auto max-w-6xl px-4 pb-4">{children}</div>}
    </section>
  );
}
