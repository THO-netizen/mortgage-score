import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

/**
 * Step navigation bar — premium private banking aesthetic.
 * Mobile:  stacked (Continue full-width, Back as centered text below).
 * Desktop: horizontal (Back left, Continue right).
 * Touch targets: minimum 48px height.
 */
export default function ActionBar({
  onBack,
  onContinue,
  canContinue  = false,
  isFirst      = false,
  isLast       = false,
  loading      = false,
  loadingLabel = 'Calculating...',
}) {
  return (
    <div className="pt-6 border-t border-[#E2E8F0] safe-bottom">

      {/* Mobile layout: stacked */}
      <div className="flex flex-col gap-3 sm:hidden">
        {/* Continue — full width */}
        <button
          onClick={onContinue}
          disabled={!canContinue || loading}
          className="w-full min-h-[52px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-7 font-display text-[15px] font-bold text-[#FFFBF5] transition-colors duration-150 select-none hover:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed"
          type="button"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2 animate-pulse">
              <Loader2 size={15} className="animate-spin" />
              {loadingLabel}
            </span>
          ) : (
            <>
              {isLast ? 'See My Results' : 'Continue'}
              <ArrowRight size={15} />
            </>
          )}
        </button>

        {/* Back — text link style */}
        {!isFirst && (
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 min-h-[48px] text-sm font-medium text-ink-muted active:text-ink transition-colors"
            type="button"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        )}
      </div>

      {/* Desktop layout: horizontal */}
      <div className="hidden sm:flex items-center justify-between">
        {!isFirst ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 min-h-[48px] px-3 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            type="button"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        ) : (
          <span />
        )}

        <button
          onClick={onContinue}
          disabled={!canContinue || loading}
          className="min-h-[52px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-8 font-display text-[15px] font-bold text-[#FFFBF5] transition-colors duration-150 select-none hover:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed"
          type="button"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2 animate-pulse">
              <Loader2 size={15} className="animate-spin" />
              {loadingLabel}
            </span>
          ) : (
            <>
              {isLast ? 'See My Results' : 'Continue Assessment'}
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>

    </div>
  )
}
