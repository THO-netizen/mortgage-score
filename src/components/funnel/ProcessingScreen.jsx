import { useEffect, useRef, useState } from 'react'

const STEPS = [
  { text: 'Evaluating affordability',        ms: 900 },
  { text: 'Reviewing financing structure',   ms: 800 },
  { text: 'Identifying important factors',   ms: 800 },
  { text: 'Preparing your assessment',       ms: 700 },
]

const TOTAL_MS = STEPS.reduce((s, p) => s + p.ms, 0)

export default function ProcessingScreen({ onComplete }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [done, setDone] = useState(false)
  const barRef = useRef(null)
  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    // Start progress line animation
    if (barRef.current) {
      barRef.current.style.transform = 'scaleX(1)'
    }

    let elapsed = 0
    const timers = STEPS.map((step, i) => {
      if (i === 0) return null
      elapsed += STEPS[i - 1].ms
      return setTimeout(() => setStepIdx(i), elapsed)
    })

    const doneTimer = setTimeout(() => {
      setDone(true)
      setTimeout(onComplete, 400)
    }, TOTAL_MS)

    return () => {
      timers.forEach(t => t && clearTimeout(t))
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  const label = done ? 'Assessment ready' : STEPS[stepIdx].text

  return (
    <main className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-4 relative">
      {/* Progress line at top */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-white/5">
        <div
          ref={barRef}
          className="h-full origin-left bg-bronze/60"
          style={{
            transform: 'scaleX(0)',
            transition: prefersReduced
              ? 'none'
              : `transform ${TOTAL_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        />
      </div>

      {/* State text */}
      <div className="text-center" style={{ minHeight: '2.5rem' }}>
        <p
          key={label}
          className={[
            'font-display text-xl tracking-tight',
            done ? 'text-bronze' : 'text-white',
            prefersReduced ? '' : 'animate-fade-in',
          ].join(' ')}
        >
          {label}
        </p>
      </div>

      {/* Pulse indicator */}
      {!done && !prefersReduced && (
        <span className="mt-8 block w-1 h-1 rounded-full bg-white/40 animate-ping-soft" />
      )}

      {/* Trust badge */}
      <p className="absolute bottom-8 text-[11px] text-slate-600 tracking-wide">
        Private &middot; Secure &middot; No data shared
      </p>
    </main>
  )
}
