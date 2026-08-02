import { useState } from 'react'
import { formatCZK } from '../../utils/formatters.js'

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

  const handleChange = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    setRaw(digits)
    const n = parseInt(digits, 10) || 0
    if (n > 0) onChange(n)
  }

  return (
    <div>
      {(label || sublabel) && (
        <div className="flex items-baseline justify-between mb-2">
          {label    && <label htmlFor={id} className="section-label">{label}</label>}
          {sublabel && <span className="text-[11px] text-ink-subtle">{sublabel}</span>}
        </div>
      )}
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={focused ? raw : (value > 0 ? formatCZK(value) : '')}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className="input-field pr-14"
        />
        {(focused ? raw.length > 0 : value > 0) && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-subtle pointer-events-none font-medium">
            CZK
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-ink-muted mt-1.5">{hint}</p>}
    </div>
  )
}
