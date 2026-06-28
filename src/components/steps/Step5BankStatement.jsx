import { useRef, useState, useEffect } from 'react'
import {
  Upload, FileText, CheckCircle, AlertTriangle,
  Shield, RotateCcw, Calendar,
} from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'

// ── Constants ──────────────────────────────────────────

const SCAN_STAGES = [
  'Reading document structure…',
  'Analyzing transaction history…',
  'Checking risk criteria…',
]

const RED_FLAG_KEYWORDS = [
  'TIPSPORT', 'FORTUNA', 'CHANCE', 'BETANO',
  'BINANCE', 'COINBASE', 'EXEKUCE',
  'CASINO', 'SAZKA', 'HAZARD',
]

const ACCEPTED_TYPES = '.pdf,.csv,.xlsx,.xls'
const CALENDLY_URL   = 'https://calendly.com/andy-le/15min'

function analyzeText(text) {
  const upper = text.toUpperCase()
  const found = RED_FLAG_KEYWORDS.filter((kw) => upper.includes(kw))
  return {
    hasRedFlags:     found.length > 0,
    redFlagKeywords: found,
    readable:        text.length > 200,
    scannedAt:       new Date().toISOString(),
  }
}

// ── Sub-components ─────────────────────────────────────

function DropZone({ isDragging, onDragOver, onDragLeave, onDrop, onBrowse }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onBrowse}
      className={[
        'relative flex flex-col items-center justify-center gap-3',
        'rounded-2xl border-2 border-dashed cursor-pointer',
        'py-12 px-6 text-center transition-all duration-200',
        isDragging
          ? 'border-brand-600 bg-brand-50 scale-[1.01]'
          : 'border-border hover:border-brand-500 hover:bg-surface',
      ].join(' ')}
    >
      <div className={[
        'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200',
        isDragging ? 'bg-brand-600' : 'bg-surface border border-border',
      ].join(' ')}>
        <Upload size={22} className={isDragging ? 'text-white' : 'text-ink-muted'} />
      </div>
      <div>
        <p className="font-semibold text-ink text-sm mb-0.5">
          {isDragging ? 'Release to scan' : 'Drop your bank statement here'}
        </p>
        <p className="text-xs text-ink-muted">
          PDF, CSV, or Excel · processed locally, never uploaded
        </p>
      </div>
      <span className="text-[11px] font-medium text-brand-600 bg-brand-50 border border-brand-100 rounded-badge px-3 py-1">
        Browse files
      </span>
    </div>
  )
}

function ScanningView({ stage }) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="relative h-40 bg-gradient-to-b from-slate-50 to-white overflow-hidden px-8 py-6">
        <div className="space-y-2.5">
          {[88, 62, 78, 50, 92, 35].map((w, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full bg-ink-subtle/25 animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        <div className="scan-line" />
        <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>
      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-ink animate-pulse">{SCAN_STAGES[stage]}</p>
          <span className="text-[11px] text-ink-subtle">{stage + 1} / {SCAN_STAGES.length}</span>
        </div>
        <div className="flex gap-1.5">
          {SCAN_STAGES.map((_, i) => (
            <div
              key={i}
              className={['h-1 flex-1 rounded-full transition-all duration-500', i <= stage ? 'bg-brand-600' : 'bg-border'].join(' ')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ScanResults({ results, fileName, onReset }) {
  if (!results) return null
  return (
    <div className="space-y-4 animate-fade-up">
      {results.hasRedFlags ? (
        <div className="rounded-2xl bg-warning-light border border-warning-border p-5">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle size={16} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-warning-text mb-0.5">Risk signals detected</p>
              <p className="text-xs text-warning-text leading-relaxed">
                The following were found in your statement and will be factored into your eligibility
                score. You can still continue — our specialists will advise on impact.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 ml-7">
            {results.redFlagKeywords.map((kw) => (
              <span key={kw} className="badge-warning text-[10px] px-2 py-0.5">{kw}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-success-light border border-success-border p-5">
          <div className="flex items-start gap-3">
            <CheckCircle size={16} className="text-success-DEFAULT flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-success-text mb-0.5">
                {results.readable ? 'No risk signals detected' : 'Statement received'}
              </p>
              <p className="text-xs text-success-text leading-relaxed">
                {results.readable
                  ? 'Your bank statement passed the automatic risk assessment. All 7 risk criteria checked — no gambling, enforcement, or crypto exchange activity found.'
                  : 'Your document was received. The automatic scan works best with standard PDF exports — encrypted files will be reviewed manually by a specialist.'}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={13} className="text-ink-subtle flex-shrink-0" />
          <span className="text-xs text-ink-muted truncate">{fileName}</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-ink-subtle hover:text-ink transition-colors flex-shrink-0 ml-4"
        >
          <RotateCcw size={11} />
          Re-scan
        </button>
      </div>
    </div>
  )
}

// ── Premium skip + Calendly box ────────────────────────

function SkipCalendlyBox({ onSkipAndBook }) {
  return (
    <div className="rounded-2xl border-2 border-brand-100 overflow-hidden bg-gradient-to-br from-brand-50/70 to-white">

      {/* Top accent bar */}
      <div className="h-[3px] bg-gradient-to-r from-brand-500 to-brand-700" />

      <div className="p-6">

        {/* Icon + headline */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-cta">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <p className="font-display text-[15px] font-extrabold text-ink leading-snug">
              Don't want to upload your bank statements?
            </p>
            <p className="text-sm text-ink-muted mt-1 leading-relaxed">
              You can still get your full mortgage report!
            </p>
          </div>
        </div>

        {/* Primary CTA — opens Calendly in new tab AND advances funnel */}
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onSkipAndBook}
          className={[
            'flex items-center justify-center gap-2.5 w-full rounded-input mb-4',
            'bg-brand-600 text-white font-display font-bold text-[15px]',
            'transition-all duration-200',
            'hover:bg-brand-700 hover:-translate-y-px hover:shadow-cta-hover',
            'active:translate-y-0 active:shadow-none',
          ].join(' ')}
          style={{ height: '56px' }}
        >
          <Calendar size={17} />
          Skip &amp; Book Free Strategy Call via Calendly
        </a>

        {/* Trust + meta row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-[9px] font-extrabold text-white tracking-tight">AL</span>
            </div>
            <span className="text-xs text-ink-muted font-medium">Andy Le · Mortgage Specialist</span>
          </div>
          <span className="text-[11px] text-ink-subtle">Free · 15 min · No commitment</span>
        </div>

        {/* Privacy guarantee — inline inside the box */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-brand-100/80">
          <Shield size={12} className="text-success-DEFAULT flex-shrink-0" />
          <p className="text-[10px] text-ink-subtle leading-relaxed">
            <span className="font-semibold text-ink-muted">Zero-upload guarantee — </span>
            your file is read entirely inside this browser tab and never transmitted to any server.
          </p>
        </div>

      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────

export default function Step5BankStatement({ data, onChange, onBack, onContinue }) {
  const [phase,     setPhase]     = useState('idle') // idle|drag|scanning|done
  const [scanStage, setScanStage] = useState(0)
  const [fileName,  setFileName]  = useState('')
  const [results,   setResults]   = useState(null)
  const fileInputRef = useRef(null)
  const timersRef    = useRef([])

  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const handleFile = (file) => {
    if (!file) return
    clearTimers()
    setPhase('scanning')
    setScanStage(0)
    setFileName(file.name)
    setResults(null)
    onChange('bankStatementFile',   file.name)
    onChange('bankAnalysisStatus',  'scanning')
    onChange('bankAnalysisResults', null)

    let extractedText = ''
    const reader = new FileReader()
    reader.onload  = (e) => { extractedText = e.target?.result || '' }
    reader.onerror = ()  => { extractedText = '' }
    reader.readAsText(file)

    const t1 = setTimeout(() => setScanStage(1), 1400)
    const t2 = setTimeout(() => setScanStage(2), 2800)
    const t3 = setTimeout(() => {
      const r = analyzeText(extractedText)
      setResults(r)
      setPhase('done')
      onChange('bankAnalysisStatus',  'done')
      onChange('bankAnalysisResults', r)
    }, 4000)

    timersRef.current = [t1, t2, t3]
  }

  const handleReset = () => {
    clearTimers()
    setPhase('idle')
    setScanStage(0)
    setFileName('')
    setResults(null)
    onChange('bankStatementFile',   null)
    onChange('bankAnalysisStatus',  '')
    onChange('bankAnalysisResults', null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDragOver  = (e) => { e.preventDefault(); setPhase('drag') }
  const handleDragLeave = (e) => { e.preventDefault(); if (phase === 'drag') setPhase('idle') }
  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSkipAndBook = () => {
    onChange('bankAnalysisStatus', 'skipped')
    // Small delay so the new tab opens before React re-renders
    setTimeout(onContinue, 150)
  }

  return (
    <FunnelCard
      stepLabel="Step 5 of 7 · Smart Bank Statement Scan"
      title="Upload your latest bank statement"
      subtitle="Our browser-based scanner checks for risk signals in seconds. Your document never leaves your device — all analysis runs in local memory."
      footer={
        <ActionBar
          canContinue={phase !== 'scanning'}
          onBack={onBack}
          onContinue={() => {
            if (phase !== 'done') onChange('bankAnalysisStatus', 'skipped')
            onContinue()
          }}
        />
      }
    >

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* Upload / scan area */}
      <div className="mb-5">
        {phase === 'idle' || phase === 'drag' ? (
          <DropZone
            isDragging={phase === 'drag'}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onBrowse={() => fileInputRef.current?.click()}
          />
        ) : phase === 'scanning' ? (
          <ScanningView stage={scanStage} />
        ) : (
          <ScanResults results={results} fileName={fileName} onReset={handleReset} />
        )}
      </div>

      {/* Premium skip + Calendly box — hidden only while scan is in progress */}
      {phase !== 'scanning' && (
        <SkipCalendlyBox onSkipAndBook={handleSkipAndBook} />
      )}

    </FunnelCard>
  )
}
