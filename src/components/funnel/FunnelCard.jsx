/**
 * Mobile-first funnel card.
 * - On mobile (<640px): full-width, no border/shadow — feels like a focused question.
 * - On tablet/desktop: white card with border, shadow, rounded corners.
 * - Supports `hint` prop for contextual insights below the title.
 */
export default function FunnelCard({
  title,
  subtitle,
  hint,
  children,
  footer,
}) {
  return (
    <div className="sm:card-surface sm:overflow-hidden">

      {/* Card header — conversational question */}
      <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-4 sm:pb-6 sm:border-b sm:border-border">
        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink tracking-tight leading-snug mb-1.5">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-ink-muted leading-relaxed max-w-xl">
            {subtitle}
          </p>
        )}
        {hint && (
          <p className="mt-2.5 text-xs text-brand-600 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 leading-relaxed">
            {hint}
          </p>
        )}
      </div>

      {/* Card body */}
      <div className="px-5 sm:px-8 py-5 sm:py-8">
        {children}
      </div>

      {/* Card footer / action bar */}
      {footer && (
        <div className="px-5 sm:px-8 pb-5 sm:pb-8 pt-2">
          {footer}
        </div>
      )}
    </div>
  )
}
