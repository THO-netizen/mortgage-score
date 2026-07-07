import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

/**
 * Step navigation bar — Back (ghost) + Continue (CTA).
 * isFirst: hides the Back button.
 * isLast:  changes Continue label to "See My Results".
 */
export default function ActionBar({
  onBack,
  onContinue,
  canContinue  = false,
  isFirst      = false,
  isLast       = false,
  loading      = false,
  loadingLabel = 'Calculating…',
}) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-border">

      {/* Back */}
      {!isFirst ? (
        <button
          onClick={onBack}
          className="btn-ghost"
          type="button"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      ) : (
        /* Placeholder so Continue stays right-aligned */
        <span />
      )}

      {/* Continue / Submit */}
      <button
        onClick={onContinue}
        disabled={!canContinue || loading}
        className="btn-cta"
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
  )
}
