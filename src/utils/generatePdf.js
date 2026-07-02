import { jsPDF } from 'jspdf'
import {
  computeScore,
  computeMortgageProfile,
} from './scoringEngine.js'

// ── Helpers ──────────────────────────────────────────────

function czk(n) {
  if (!n || n <= 0) return '—'
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency', currency: 'CZK', maximumFractionDigits: 0,
  }).format(n)
}

function czkShort(n) {
  if (!n || n <= 0) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M Kč`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K Kč`
  return `${Math.round(n)} Kč`
}

function pct(n) {
  return n != null ? `${Number(n).toFixed(1)}%` : '—'
}

function scoreLabel(s) {
  if (s >= 75) return 'Strong Applicant'
  if (s >= 55) return 'Good Standing'
  if (s >= 35) return 'Needs Review'
  return 'High Risk'
}

function entityLabel(entityType) {
  const m = {
    zamestnanec: 'Employee (Zaměstnanec)',
    osvc:        'Self-Employed (OSVČ)',
    sro:         's.r.o. Director',
    other:       'Other / Complex',
  }
  return m[entityType] ?? entityType
}

function residenceLabel(r) {
  const m = {
    eu:            'EU / EEA Citizen',
    permanent:     'Permanent Residence (TP)',
    longterm5plus: 'Long-term Residence 5+ yrs',
    longterm:      'Long-term Residence <5 yrs',
    employment:    'Long-term (Work/Business Permit)',
    other:         'Other / Student',
  }
  return m[r] ?? r
}

function taxLabel(taxRegime) {
  if (taxRegime === 'flat_tax') return 'Flat Tax (Paušální daň)'
  if (taxRegime === 'tax_return') return 'Standard Tax Return'
  return '—'
}

// ── Main export ──────────────────────────────────────────

export function generateMortgagePdf(formData, userName) {
  const score   = computeScore(formData)
  const sLabel  = scoreLabel(score)

  const resolvedIncome = (formData.netMonthlySalary > 0 ? formData.netMonthlySalary : formData.netIncome) || 0
  const profile = computeMortgageProfile({ ...formData, netIncome: resolvedIncome })

  const {
    eX, eXStress, varX, dstiAtEX, dtiRatio,
    ltvPct, maxLTVPct, maxDTIVal, maturity,
    existingDebt, flags, redFlags,
  } = profile

  const today = new Date().toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long', day: 'numeric' })

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W   = 210
  const M   = 20   // margin left/right
  const CW  = W - M * 2

  let y = 0

  // ── helper draw functions ────────────────────────

  function heading1(text, yPos) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(15, 23, 42)
    doc.text(text, M, yPos)
    return yPos + 9
  }

  function heading2(text, yPos) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text(text, M, yPos)
    return yPos + 7
  }

  function body(text, yPos, { indent = 0, color = [71, 85, 105] } = {}) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, CW - indent)
    doc.text(lines, M + indent, yPos)
    return yPos + lines.length * 5
  }

  function label(text, yPos) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(text.toUpperCase(), M, yPos)
    return yPos + 4
  }

  function value(text, yPos) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(text, M, yPos)
    return yPos + 6
  }

  function hRule(yPos, { alpha = 0.12 } = {}) {
    doc.setDrawColor(15, 23, 42)
    doc.setLineWidth(0.3)
    doc.setGState(doc.GState({ opacity: alpha }))
    doc.line(M, yPos, W - M, yPos)
    doc.setGState(doc.GState({ opacity: 1 }))
    return yPos + 5
  }

  function metricBox(lbl, val, xLeft, yPos, boxW) {
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(xLeft, yPos, boxW, 18, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text(lbl.toUpperCase(), xLeft + 4, yPos + 5.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(val, xLeft + 4, yPos + 13)
  }

  // ── PAGE 1 ────────────────────────────────────────────

  // Dark header bar
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, W, 38, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('Mortgage Pre-Scoring Report', M, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(`Prepared for: ${userName || 'Applicant'}`, M, 24)
  doc.text(`Date: ${today}`, M, 30)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.text('This report reflects 2026 Czech bank underwriting guidelines. Indicative only — not financial advice.', M, 36)

  y = 50

  // Score pill
  const scoreColor = score >= 75 ? [16, 185, 129] : score >= 55 ? [59, 130, 246] : score >= 35 ? [245, 158, 11] : [239, 68, 68]
  doc.setFillColor(...scoreColor)
  doc.roundedRect(M, y, 50, 22, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text(String(score), M + 5, y + 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('/100', M + 21, y + 15)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(sLabel, M + 56, y + 9)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Czech Bank Mortgage Eligibility Score', M + 56, y + 16)

  y += 32
  y = hRule(y)

  // ── Key metrics row ─────────────────────────────

  const mBoxW = (CW - 6) / 4

  metricBox('Max Loan (E[X])',  czkShort(eX),       M,                   y, mBoxW)
  metricBox('Stress Test',      czkShort(eXStress), M + mBoxW + 2,       y, mBoxW)
  metricBox('DSTI at E[X]',     pct(dstiAtEX),      M + (mBoxW + 2) * 2, y, mBoxW)
  metricBox('DTI Ratio',        dtiRatio > 0 ? dtiRatio.toFixed(1) + '×' : '—', M + (mBoxW + 2) * 3, y, mBoxW)

  y += 26

  metricBox('LTV',              pct(ltvPct),        M,                   y, mBoxW)
  metricBox('Max LTV Cap',      pct(maxLTVPct),     M + mBoxW + 2,       y, mBoxW)
  metricBox('Max DTI Cap',      maxDTIVal + '×',    M + (mBoxW + 2) * 2, y, mBoxW)
  metricBox('Loan Term',        maturity?.maxYears ? `${maturity.maxYears} yrs` : '—', M + (mBoxW + 2) * 3, y, mBoxW)

  y += 26
  y = hRule(y)

  // ── Applicant profile section ─────────────────────

  y = heading2('Applicant Profile', y)
  y += 1

  const profileRows = [
    ['Entity / Income Type',  entityLabel(formData.entityType)],
    ['Residence Status',      residenceLabel(formData.residenceStatus)],
    ['Time in Czechia',       formData.yearsInCZ ? { 'less1': '<1 year', '1-2': '1–2 years', '2-5': '2–5 years', '5-10': '5–10 years', '10plus': '10+ years' }[formData.yearsInCZ] ?? formData.yearsInCZ : '—'],
    ['Applicant Age',         formData.applicantAge ? `${formData.applicantAge} years` : '—'],
    ['Net Monthly Income',    czk(resolvedIncome)],
    ...(formData.entityType === 'osvc' ? [
      ['Tax Regime',          taxLabel(formData.taxRegime)],
      ['Annual Turnover',     czk(formData.annualTurnover)],
    ] : []),
    ...(formData.entityType === 'zamestnanec' ? [
      ['Contract Type',       { indefinite: 'Indefinite (HPP)', definite: 'Fixed-term', agency: 'Agency', dpc: 'DPČ / DPP' }[formData.contractType] ?? '—'],
    ] : []),
    ['Existing Debt / mo',    czk(existingDebt)],
  ]

  const colW = (CW - 4) / 2
  for (let i = 0; i < profileRows.length; i += 2) {
    const left  = profileRows[i]
    const right = profileRows[i + 1]

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text((left[0] ?? '').toUpperCase(), M, y)
    if (right) doc.text((right[0] ?? '').toUpperCase(), M + colW + 4, y)
    y += 4.5

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(left[1] ?? '—', M, y)
    if (right) doc.text(right[1] ?? '—', M + colW + 4, y)
    y += 7
  }

  y = hRule(y)

  // ── Property section ──────────────────────────────

  y = heading2('Property & Financing', y)
  y += 1

  const propRows = [
    ['Purchase Price',       czk(formData.purchasePrice)],
    ['Own Funds',            czk(formData.ownFunds)],
    ['Loan Amount',          czk(Math.max(0, (formData.purchasePrice || 0) - (formData.ownFunds || 0)))],
    ['Property Purpose',     { primary: 'Primary Residence', investment: 'Investment / Rental', holiday: 'Holiday Home' }[formData.propertyPurpose] ?? '—'],
    ['LTV Ratio',            pct(ltvPct)],
    ['Max LTV (ČNB)',        pct(maxLTVPct)],
  ]

  for (let i = 0; i < propRows.length; i += 2) {
    const left  = propRows[i]
    const right = propRows[i + 1]

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text((left[0] ?? '').toUpperCase(), M, y)
    if (right) doc.text((right[0] ?? '').toUpperCase(), M + colW + 4, y)
    y += 4.5

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(left[1] ?? '—', M, y)
    if (right) doc.text(right[1] ?? '—', M + colW + 4, y)
    y += 7
  }

  // ── PAGE 2 ────────────────────────────────────────────

  doc.addPage()

  // Dark header bar (repeat on page 2)
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, W, 14, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text('Mortgage Pre-Scoring Report — continued', M, 9.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Score: ${score}/100 · ${sLabel}`, W - M, 9.5, { align: 'right' })

  y = 24

  // ── Risk Factors ────────────────────────────────

  y = heading2('Assessment Flags', y)
  y += 2

  const allFlags = [...(flags ?? []), ...(redFlags ?? [])]

  const FLAG_LABELS = {
    flat_tax_method:          { text: 'Income calculated via Flat Tax (Paušální daň) methodology', risk: false },
    turnover_method:          { text: 'Income derived from annual turnover (55% recognition coefficient)', risk: false },
    fixed_term_expiring_soon: { text: 'Fixed-term contract expiring soon — lender may require renewal evidence', risk: true },
    probation:                { text: 'Applicant in probation period — most banks will decline until end of probation', risk: true },
    no_income:                { text: 'No income provided — simulation mode only', risk: true },
    short_business_history:   { text: 'Business history <12 months — significantly limits eligible lenders', risk: true },
    young_business_12_24:     { text: 'Business history 12–24 months — reduced income recognition at some banks', risk: false },
    osvc_new_enterprise:      { text: 'New OSVČ enterprise (<12 months) — transition path; specialist routing required', risk: true },
    sro_negative_financials:  { text: 'Company financials show negative equity or loss — hard block on ESSO income', risk: true },
    sro_insufficient_history: { text: 'Company history insufficient (<12 months) — ESSO income not recognisable', risk: true },
    sro_medium_risk_50pct_cap:{ text: 'ESSO: income recognised at 50% cap (1–2 completed fiscal years)', risk: false },
    high_ltv:                 { text: 'LTV exceeds recommended threshold — fewer lenders eligible', risk: true },
    dsti_at_limit:            { text: 'DSTI close to ČNB ceiling of 45% — limited debt headroom', risk: true },
    dti_above_limit:          { text: 'DTI above applicable cap — loan amount constrained', risk: true },
    no_residence:             { text: 'Non-EU residence status — approximately 40% of Czech banks eligible', risk: true },
    agency_worker:            { text: 'Agency / temp worker — limited bank eligibility', risk: true },
    dpc_contract:             { text: 'DPČ / DPP agreement — income recognised partially or not at all', risk: true },
  }

  if (allFlags.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(100, 116, 139)
    doc.text('No significant risk flags identified.', M, y)
    y += 8
  } else {
    for (const f of allFlags) {
      const info    = FLAG_LABELS[f]
      const isRed   = redFlags?.includes(f) ?? false
      const isRisk  = info?.risk ?? isRed

      const dotColor = isRisk ? [239, 68, 68] : [245, 158, 11]
      doc.setFillColor(...dotColor)
      doc.circle(M + 1.5, y - 1, 1.5, 'F')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...(isRisk ? [127, 29, 29] : [92, 64, 4]))

      const text = info?.text ?? f.replace(/_/g, ' ')
      const lines = doc.splitTextToSize(text, CW - 8)
      doc.text(lines, M + 6, y)
      y += lines.length * 5 + 2

      if (y > 260) { doc.addPage(); y = 24 }
    }
  }

  y = hRule(y + 2)

  // ── Borrowing analysis ────────────────────────────

  y = heading2('Borrowing Analysis', y)
  y += 2

  const analysisLines = [
    ['Expected Max Loan (E[X])',        czkShort(eX)],
    ['Stressed Loan Estimate',          czkShort(eXStress)],
    ['Variance Range (±σ)',             varX > 0 ? `±${czkShort(varX)}` : '—'],
    ['DSTI at E[X]',                   dstiAtEX > 0 ? `${dstiAtEX.toFixed(1)}% (limit 45%)` : '—'],
    ['DTI Ratio',                       dtiRatio > 0 ? `${dtiRatio.toFixed(1)}× (limit ${maxDTIVal}×)` : '—'],
    ['Maximum Loan Term',               maturity?.maxYears ? `${maturity.maxYears} years` : '—'],
    ['Net Monthly Income (used)',        czk(resolvedIncome)],
    ['Existing Debt Obligations / mo',  czk(existingDebt)],
  ]

  for (const [lbl, val] of analysisLines) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(lbl, M, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(val, W - M, y, { align: 'right' })
    y += 6.5
    if (y > 260) { doc.addPage(); y = 24 }
  }

  y = hRule(y + 1)

  // ── Disclaimer ────────────────────────────────────

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  const disclaimer = 'This report is indicative only and reflects 2026 Czech bank underwriting guidelines. Final mortgage approval depends on individual bank assessment, document verification, and credit committee decisions. This tool does not constitute financial advice. Produced by MortgageScore.cz.'
  const dLines = doc.splitTextToSize(disclaimer, CW)
  doc.text(dLines, M, y)
  y += dLines.length * 4.5

  // ── Branding footer ───────────────────────────────

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 282, W, 15, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text('MortgageScore.cz', M, 291)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Andy Le — Mortgage & Property Financing Specialist', W - M, 291, { align: 'right' })

  // ── Return blob (caller handles download to stay in user-gesture context) ──

  return doc.output('blob')
}
