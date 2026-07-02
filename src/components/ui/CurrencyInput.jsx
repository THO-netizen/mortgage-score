import { useState } from 'react'
import { formatCZK } from '../../utils/formatters.js'

/**
 * Text input with live CZK formatting.
 * Shows formatted value when blurred, raw digits when focused.
 */
export default function CurrencyInput({
  id,
  label,
  sublabel,
  value   = 0,
  onChange,
  min     = 0,
  max,
  hint,
  placeholder = '0 CZK',
}) {
  const [focused, setFocused] = useState(false)
  const [raw,     setRaw]     = useState('')

  const handleFocus = () => {
    setFocused(true)
    setRaw(value > 0 ? String(value) : '')
  }

  const handleBlur = () => {
    setFocused(false)
    let n = parseInt(raw.replace(/\D/g, ''), 10) || 0
    if (min !== undefined) n = Math.max(min, n)
    if (max !== undefined) n = Math.min(max, n)
    onChange(n)
    setRaw('')
  }

  return (
    <div>
      {(label || sublabel) && (
        <div className="flex items-baseline justify-between mb-2">
          {label    && <label htmlFor={id} className="section-label">{label}</label>}
          {sublabel && <span className="text-[11px] text-ink-subtle">{sublabel}</span>}
        </div>
      )}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={focused ? raw : (value > 0 ? formatCZK(value) : '')}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ''))}
        className="input-field"
      />
      {hint && <p className="text-xs text-ink-muted mt-1.5">{hint}</p>}
    </div>
  )
}
