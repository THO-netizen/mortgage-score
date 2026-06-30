import { useEffect, useState } from 'react'

const PHASES = [
  { text: 'Analyzing financial profile…',              ms: 850  },
  { text: 'Simulating Czech bank underwriting logic…', ms: 950  },
  { text: 'Evaluating DTI / DSTI / LTV ratios…',       ms: 900  },
]

const TOTAL_MS = PHASES.reduce((s, p) => s + p.ms, 0)

export default function ProcessingScreen({ onComplete }) {
  const [phaseIdx,  setPhaseIdx]  = useState(0)
  const [progress,  setProgress]  = useState(0)
  const [done,      setDone]      = useState(false)

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
      setTimeout(onComplete, 400)
    }, TOTAL_MS)

    return () => {
      clearInterval(progressId)
      phaseTimers.forEach(clearTimeout)
      clearTimeout(doneId)
    }
  }, [onComplete])

  return (
    <main className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Terminal window */}
        <div className="bg-dark-800 border border-white/10 rounded-2xl overflow-hidden shadow-hero-card animate-fade-up">

          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-dark-900/80 border-b border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-3 text-[11px] text-slate-500 font-mono tracking-wide">
              mortgage_score — underwriting_simulation
            </span>
          </div>

          {/* Terminal body */}
          <div className="px-6 py-7 font-mono min-h-[148px] space-y-3">
            {PHASES.map((phase, i) => (
              i <= phaseIdx && (
                <div key={i} className="flex items-start gap-2.5 animate-fade-in">
                  <span className={[
                    'text-[12px] flex-shrink-0 mt-px',
                    done || i < phaseIdx ? 'text-success-DEFAULT' : 'text-brand-400',
                  ].join(' ')}>
                    {done || i < phaseIdx ? '✓' : '›'}
                  </span>
                  <span className={[
                    'text-[12px] leading-relaxed',
                    i === phaseIdx && !done ? 'text-white' : 'text-slate-500',
                  ].join(' ')}>
                    {phase.text}
                    {i === phaseIdx && !done && (
                      <span className="inline-block w-2 h-3.5 bg-brand-400 ml-1 align-middle animate-ping-soft opacity-80" />
                    )}
                  </span>
                </div>
              )
            ))}
            {done && (
              <div className="flex items-start gap-2.5 animate-fade-in">
                <span className="text-[12px] text-success-DEFAULT flex-shrink-0 mt-px">✓</span>
                <span className="text-[12px] text-success-DEFAULT">
                  Analysis complete. Generating output…
                </span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="px-6 pb-6">
            <div className="h-[3px] bg-dark-900 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-600 font-mono text-right tabular-nums">
              {progress}%
            </p>
          </div>

        </div>

        <p className="text-center text-slate-600 text-[11px] mt-6 font-mono leading-relaxed">
          Running simulation against Czech ČNB underwriting parameters.
        </p>

      </div>
    </main>
  )
}
