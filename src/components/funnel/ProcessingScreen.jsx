import { useEffect, useState } from 'react'
import { Lock, Shield } from 'lucide-react'

const PHASES = [
  { text: 'Analyzing financial profile…',                    ms: 850  },
  { text: 'Calculating DTI and LTV risk parameters…',        ms: 950  },
  { text: 'Validating against 2026 ČNB regulatory guidelines…', ms: 900 },
]

const TOTAL_MS = PHASES.reduce((s, p) => s + p.ms, 0)

export default function ProcessingScreen({ onComplete }) {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [done,     setDone]     = useState(false)

  useEffect(() => {
    const start = Date.now()

    const progressId = setInterval(() => {
      const pct = Math.min(99, Math.round(((Date.now() - start) / TOTAL_MS) * 100))
      setProgress(pct)
    }, 30)

    let elapsed = 0
    const phaseTimers = PHASES.map((p, i) => {
      const id = setTimeout(() => setPhaseIdx(i), elapsed)
      elapsed += p.ms
      return id
    })

    const doneId = setTimeout(() => {
      clearInterval(progressId)
      setProgress(100)
      setDone(true)
      setTimeout(onComplete, 500)
    }, TOTAL_MS)

    return () => {
      clearInterval(progressId)
      phaseTimers.forEach(clearTimeout)
      clearTimeout(doneId)
    }
  }, [onComplete])

  return (
    <main className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">

        {/* Score icon */}
        <div className="flex justify-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center">
            <Shield size={28} className="text-brand-400" />
          </div>
        </div>

        {/* Status text */}
        <div className="text-center mb-10" style={{ minHeight: '3rem' }}>
          {PHASES.map((phase, i) => (
            i === phaseIdx && !done && (
              <p
                key={i}
                className="text-white text-[15px] font-medium leading-relaxed animate-fade-in"
              >
                {phase.text}
              </p>
            )
          ))}
          {done && (
            <p className="text-success-DEFAULT text-[15px] font-medium animate-fade-in">
              Assessment complete.
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-[2px] bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100 ease-linear"
              style={{
                width: `${progress}%`,
                background: done
                  ? '#10B981'
                  : 'linear-gradient(90deg, #3B82F6, #6366F1)',
              }}
            />
          </div>
        </div>

        {/* Percentage */}
        <div className="flex justify-end mb-10">
          <span className="text-[11px] text-slate-600 tabular-nums">{progress}%</span>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-2 text-slate-600 text-[11px]">
          <Lock size={10} className="flex-shrink-0" />
          <span>Secure analytical environment. Data processed locally.</span>
        </div>

      </div>
    </main>
  )
}
