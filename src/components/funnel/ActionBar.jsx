import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

/**
 * Step navigation bar — mobile-first layout.
 * Mobile:  stacked vertically (Continue full-width on top, Back as text link below).
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
    <div className="pt-6 border-t border-border safe-bottom">

      {/* Mobile layout: stacked */}
      <div className="flex flex-col gap-3 sm:hidden">
        {/* Continue — full width */}
        <button
          onClick={onContinue}
          disabled={!canContinue || loading}
          className="btn-cta w-full min-h-[48px]"
          type="button"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              {loadingLabel}
            </>
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
            className="flex items-center justify-center gap-1.5 min-h-[44px] text-sm font-medium text-ink-muted active:text-ink transition-colors"
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
            className="btn-ghost min-h-[48px]"
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
          className="btn-cta min-h-[48px]"
          type="button"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              {loadingLabel}
            </>
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
