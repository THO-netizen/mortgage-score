/**
 * Mobile-first funnel card with premium private banking aesthetic.
 * - Mobile: full-width, no border/shadow — native screen feel.
 * - Desktop: subtle card with very thin border and minimal shadow.
 * - Supports `hint` prop with warm accent left border.
 */
export default function FunnelCard({
  title,
  subtitle,
  hint,
  children,
  footer,
}) {
  return (
    <div className="sm:bg-white sm:border sm:border-[#E2E8F0] sm:rounded-2xl sm:shadow-[0_1px_3px_rgba(0,0,0,.04)]">

      {/* Card header */}
      <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-4 sm:pb-6 sm:border-b sm:border-[#E2E8F0]">
        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink tracking-tight leading-snug mb-1">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-ink-muted leading-relaxed max-w-xl truncate">
            {subtitle}
          </p>
        )}
        {hint && (
          <p className="mt-3 text-xs text-ink-muted leading-relaxed pl-3 border-l-2 border-[#C9A96E]">
            {hint}
          </p>
        )}
      </div>

      {/* Card body */}
      <div className="px-5 sm:px-8 py-5 sm:py-8">
        {children}
      </div>

      {/* Card footer */}
      {footer && (
        <div className="px-5 sm:px-8 pb-5 sm:pb-8 pt-2">
          {footer}
        </div>
      )}
    </div>
  )
}
