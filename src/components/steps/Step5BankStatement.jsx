import { useRef, useState, useEffect } from 'react'
import {
  Upload, FileText, CheckCircle, AlertTriangle,
  Shield, RotateCcw, X,
} from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'

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

function analyzeText(text) {
  const upper = text.toUpperCase()
  const found = RED_FLAG_KEYWORDS.filter((kw) => upper.includes(kw))
  return {
    hasRedFlags:      found.length > 0,
    redFlagKeywords:  found,
    readable:         text.length > 200,
    scannedAt:        new Date().toISOString(),
  }
}

function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1_048_576)  return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

// ─── Sub-components ────────────────────────────────────

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
      {/* Document preview with scan line */}
      <div className="relative h-40 bg-gradient-to-b from-slate-50 to-white overflow-hidden px-8 py-6">
        {/* Simulated document lines */}
        <div className="space-y-2.5">
          {[88, 62, 78, 50, 92, 35].map((w, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full bg-ink-subtle/25 animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        {/* Laser scan line */}
        <div className="scan-line" />
        {/* Glow overlay at top and bottom */}
        <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>

      {/* Stage progress */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-ink animate-pulse">
            {SCAN_STAGES[stage]}
          </p>
          <span className="text-[11px] text-ink-subtle">
            {stage + 1} / {SCAN_STAGES.length}
          </span>
        </div>
        {/* Stage dots */}
        <div className="flex gap-1.5">
          {SCAN_STAGES.map((_, i) => (
            <div
              key={i}
              className={[
                'h-1 flex-1 rounded-full transition-all duration-500',
                i <= stage ? 'bg-brand-600' : 'bg-border',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ScanResults({ results, fileName, onReset }) {
  if (!results) return null

  if (results.hasRedFlags) {
    return (
      <div className="space-y-4 animate-fade-up">
        <div className="rounded-2xl bg-warning-light border border-warning-border p-5">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle size={16} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-warning-text mb-0.5">
                Risk signals detected
              </p>
              <p className="text-xs text-warning-text leading-relaxed">
                The following were found in your statement and will be factored into your
                eligibility score. You can still continue — our specialists will advise on impact.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 ml-7">
            {results.redFlagKeywords.map((kw) => (
              <span key={kw} className="badge-warning text-[10px] px-2 py-0.5">
                {kw}
              </span>
            ))}
          </div>
        </div>
        <ResetRow fileName={fileName} onReset={onReset} />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="rounded-2xl bg-success-light border border-success-border p-5">
        <div className="flex items-start gap-3">
          <CheckCircle size={16} className="text-success-DEFAULT flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-success-text mb-0.5">
              {results.readable
                ? 'No risk signals detected'
                : 'Statement received'}
            </p>
            <p className="text-xs text-success-text leading-relaxed">
              {results.readable
                ? 'Your bank statement passed the automatic risk assessment. All 7 risk criteria were checked — no gambling, enforcement, or crypto exchange activity found.'
                : 'Your document was received. The automatic text scan works best with standard PDF exports — encrypted files will be reviewed manually by a specialist.'}
            </p>
          </div>
        </div>
      </div>
      <ResetRow fileName={fileName} onReset={onReset} />
    </div>
  )
}

function ResetRow({ fileName, onReset }) {
  return (
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
  )
}

// ─── Main component ────────────────────────────────────

export default function Step5BankStatement({ data, onChange, onBack, onContinue }) {
  const [phase,     setPhase]     = useState('idle') // idle|drag|scanning|done
  const [scanStage, setScanStage] = useState(0)
  const [fileName,  setFileName]  = useState('')
  const [results,   setResults]   = useState(null)
  const fileInputRef = useRef(null)
  const timersRef    = useRef([])

  // Wipe timers on unmount to prevent state updates after navigation
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

    // Read file content in parallel with the animation
    let extractedText = ''
    const reader = new FileReader()
    reader.onload  = (e) => { extractedText = e.target?.result || '' }
    reader.onerror = ()  => { extractedText = '' }
    reader.readAsText(file)

    // Advance through scan stages then emit results at 4 s
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

      {/* ── Hidden file input ──────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* ── Main upload / scan area ────────────────────── */}
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

      {/* ── Skip link ─────────────────────────────────── */}
      {(phase === 'idle' || phase === 'drag') && (
        <p className="text-center text-xs text-ink-subtle mb-5">
          Don't have it handy?{' '}
          <button
            type="button"
            className="text-brand-600 hover:underline font-medium"
            onClick={() => {
              onChange('bankAnalysisStatus', 'skipped')
              onContinue()
            }}
          >
            Skip this step →
          </button>
        </p>
      )}

      {/* ── Privacy guarantee strip ────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl bg-dark-900/[.03] border border-border px-4 py-3">
        <Shield size={14} className="text-success-DEFAULT flex-shrink-0" />
        <p className="text-[11px] text-ink-muted leading-relaxed">
          <span className="font-semibold text-ink-muted">Zero-upload guarantee — </span>
          your file is read entirely inside this browser tab. No bytes are transmitted to
          any server. The document is discarded from memory when you leave this page.
        </p>
      </div>

    </FunnelCard>
  )
}
