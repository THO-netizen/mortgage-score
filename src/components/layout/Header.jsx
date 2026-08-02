
/**
 * Sticky glassmorphism header with smooth progress bar.
 * Accepts `progress` (0-1 float) and `label` (e.g. "Question 3 of 9").
 * Shows progress only during the funnel (when progress > 0).
 */
export default function Header({ progress = 0, label = '' }) {
  const isFunnel    = progress > 0
  const progressPct = Math.round(progress * 100)

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-4 sm:gap-6">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
            <svg
              width="14" height="14" viewBox="0 0 16 16"
              fill="none" xmlns="http://www.w3.org/2000/svg"
              className="sm:w-4 sm:h-4"
            >
              <rect x="1"  y="9"  width="3" height="6" rx="1" fill="white" fillOpacity=".7" />
              <rect x="6"  y="5"  width="3" height="10" rx="1" fill="white" fillOpacity=".9" />
              <rect x="11" y="1"  width="3" height="14" rx="1" fill="white" />
            </svg>
          </div>
          <span className="font-display font-extrabold text-ink tracking-tight leading-none text-sm sm:text-base">
            MORTGAGE{' '}
            <span className="text-brand-600">SCORE</span>
            <sup className="text-[8px] sm:text-[9px] font-normal tracking-normal align-super ml-px">TM</sup>
          </span>
        </a>

        {/* Progress bar + label (visible on all sizes during funnel) */}
        {isFunnel && (
          <div className="flex flex-1 items-center gap-3 max-w-xs ml-auto sm:mx-auto">
            <div className="flex-1 h-1.5 sm:h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {label && (
              <span className="text-[11px] sm:text-label text-ink-muted whitespace-nowrap tabular-nums flex-shrink-0">
                {label}
              </span>
            )}
          </div>
        )}

      </div>
    </header>
  )
}
