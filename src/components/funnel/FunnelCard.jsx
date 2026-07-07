/**
 * White surface card that wraps every funnel step.
 * Spec: rounded-3xl, white bg, soft shadow, large padding.
 */
export default function FunnelCard({
  stepLabel,
  title,
  subtitle,
  children,
  footer,
}) {
  return (
    <div className="card-surface overflow-hidden">

      {/* ── Card header ──────────────────────────────── */}
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-7 border-b border-border">
        {stepLabel && (
          <p className="section-label mb-3">{stepLabel}</p>
        )}
        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink tracking-tight leading-snug mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-ink-muted leading-relaxed max-w-xl">
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Card body ────────────────────────────────── */}
      <div className="px-5 sm:px-8 py-6 sm:py-8">
        {children}
      </div>

      {/* ── Card footer / action bar ─────────────────── */}
      {footer && (
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-2">
          {footer}
        </div>
      )}
    </div>
  )
}
