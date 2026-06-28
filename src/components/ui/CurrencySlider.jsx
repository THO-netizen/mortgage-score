import { formatCZK } from '../../utils/formatters.js'

/**
 * Range slider with a live CZK value display and min/max labels.
 */
export default function CurrencySlider({
  id,
  label,
  sublabel,
  value   = 0,
  onChange,
  min     = 0,
  max     = 10_000_000,
  step    = 100_000,
  hint,
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        {label    && <label htmlFor={id} className="section-label">{label}</label>}
        {sublabel && <span className="text-[11px] text-ink-subtle">{sublabel}</span>}
      </div>

      <div className="mb-3">
        <span className="font-display text-[26px] font-extrabold text-ink tracking-tight tabular-nums">
          {formatCZK(value)}
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-field"
      />

      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] text-ink-subtle">{formatCZK(min)}</span>
        <span className="text-[11px] text-ink-subtle">{formatCZK(max)}</span>
      </div>

      {hint && <p className="text-xs text-ink-muted mt-2">{hint}</p>}
    </div>
  )
}
