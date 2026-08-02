
/**
 * Premium private banking header with thin bronze progress line.
 * Accepts `progress` (0-1 float), `label` (e.g. "3 of 13"),
 * `sectionName` (e.g. "Income profile"), and `estimatedMinutes` (number).
 * Shows progress only during the funnel (when progress > 0).
 */
export default function Header({ progress = 0, label = '', sectionName = '', estimatedMinutes }) {
  const isFunnel    = progress > 0
  const progressPct = Math.round(progress * 100)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0F172A] flex items-center justify-center">
            <svg
              width="14" height="14" viewBox="0 0 16 16"
              fill="none" xmlns="http://www.w3.org/2000/svg"
              className="sm:w-4 sm:h-4"
            >
              <rect x="1"  y="9"  width="3" height="6" rx="1" fill="white" fillOpacity=".5" />
              <rect x="6"  y="5"  width="3" height="10" rx="1" fill="white" fillOpacity=".75" />
              <rect x="11" y="1"  width="3" height="14" rx="1" fill="white" />
            </svg>
          </div>
          <span className="font-display font-extrabold text-ink tracking-tight leading-none text-sm sm:text-base">
            MORTGAGE{' '}
            <span className="text-[#C9A96E]">SCORE</span>
            <sup className="text-[8px] sm:text-[9px] font-normal tracking-normal align-super ml-px">TM</sup>
          </span>
        </a>

        {/* Center info: section name, step count, time estimate */}
        {isFunnel && (
          <span className="text-[11px] sm:text-xs text-ink-muted font-medium whitespace-nowrap tabular-nums">
            {sectionName && <span>{sectionName}</span>}
            {sectionName && label && <span className="mx-1.5 opacity-40">&middot;</span>}
            {label && <span>{label}</span>}
            {label && estimatedMinutes != null && <span className="mx-1.5 opacity-40">&middot;</span>}
            {estimatedMinutes != null && <span>~{estimatedMinutes} min left</span>}
          </span>
        )}

      </div>

      {/* Thin bronze progress line at the very bottom of the header */}
      {isFunnel && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E2E8F0]">
          <div
            className="h-full bg-[#C9A96E] transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </header>
  )
}
