// ── Design tokens & jsPDF drawing helpers ──────────────────────────────────

export const C = {
  navy:      [15,  23,  42],
  navyMid:   [30,  41,  59],
  gold:      [146, 128, 90],
  goldLight: [245, 240, 230],
  surface:   [248, 250, 252],
  surfaceAlt:[241, 245, 249],
  border:    [226, 232, 240],
  ink:       [15,  23,  42],
  slate:     [71,  85,  105],
  muted:     [148, 163, 184],
  white:     [255, 255, 255],
  successBg: [236, 253, 245],
  successTx: [6,   78,  59],
  successAc: [16,  185, 129],
  warningBg: [255, 251, 235],
  warningTx: [92,  64,  4],
  warningAc: [245, 158, 11],
  riskBg:    [254, 242, 242],
  riskTx:    [127, 29,  29],
  riskAc:    [239, 68,  68],
  brand:     [37,  99,  235],
  brandLight:[239, 246, 255],
}

export const PAGE = {
  W:  210,
  H:  297,
  M:  22,
  CW: 166,
  FOOTER: 285,
}

const HALF = (PAGE.CW - 3) / 2

// ── Typography ──────────────────────────────────────────────────────────────

export function setDisplay(doc, size = 24) {
  doc.setFont('times', 'bold')
  doc.setFontSize(size)
}

export function setHeading(doc, size = 14) {
  doc.setFont('times', 'bold')
  doc.setFontSize(size)
}

export function setLabel(doc, size = 6.5) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(size)
}

export function setBody(doc, size = 9) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(size)
}

export function setBold(doc, size = 9) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(size)
}

// ── Layout primitives ───────────────────────────────────────────────────────

export function pageHeader(doc, sectionTitle, pageNum, totalPages) {
  doc.setFillColor(...C.navy)
  doc.rect(0, 0, PAGE.W, 11, 'F')
  setBold(doc, 7)
  doc.setTextColor(...C.white)
  doc.text('MORTGAGE SCORE  ·  PRIVATE & CONFIDENTIAL', PAGE.M, 7.2)
  setLabel(doc, 7)
  doc.setTextColor(...C.muted)
  doc.text(`${sectionTitle.toUpperCase()}  ·  ${pageNum} / ${totalPages}`, PAGE.W - PAGE.M, 7.2, { align: 'right' })
}

export function pageFooter(doc) {
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.2)
  doc.line(PAGE.M, PAGE.FOOTER, PAGE.W - PAGE.M, PAGE.FOOTER)
  setBody(doc, 6.5)
  doc.setTextColor(...C.muted)
  doc.text(
    'This report is indicative only and does not constitute financial advice. ' +
    'Final approval depends on individual bank assessment. © MortgageScore.cz — Andy Le, Mortgage Specialist.',
    PAGE.M, PAGE.FOOTER + 4.5,
  )
}

export function hRule(doc, y, alpha = 0.12) {
  doc.setDrawColor(...C.border)
  doc.setLineWidth(alpha < 0.2 ? 0.15 : 0.25)
  doc.line(PAGE.M, y, PAGE.W - PAGE.M, y)
  return y + 4.5
}

export function thinRule(doc, y) {
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.15)
  doc.line(PAGE.M, y, PAGE.W - PAGE.M, y)
  return y + 3
}

export function accentRule(doc, y) {
  doc.setDrawColor(...C.gold)
  doc.setLineWidth(0.5)
  doc.line(PAGE.M, y, PAGE.M + 30, y)
  return y + 5
}

// ── Section header ──────────────────────────────────────────────────────────

export function sectionHeader(doc, title, subtitle, y) {
  setHeading(doc, 17)
  doc.setTextColor(...C.navy)
  doc.text(title, PAGE.M, y)
  y += 6.5
  if (subtitle) {
    setBody(doc, 8.5)
    doc.setTextColor(...C.slate)
    doc.text(subtitle, PAGE.M, y)
    y += 5
  }
  return accentRule(doc, y)
}

// ── Body text ───────────────────────────────────────────────────────────────

export function bodyText(doc, text, y, opts = {}) {
  const { indent = 0, color = C.slate, size = 9, lineH = 5.2, w } = opts
  setBody(doc, size)
  doc.setTextColor(...color)
  const maxW = (w ?? PAGE.CW) - indent
  const lines = doc.splitTextToSize(text, maxW)
  doc.text(lines, PAGE.M + indent, y)
  return y + lines.length * lineH
}

export function boldText(doc, text, y, opts = {}) {
  const { indent = 0, color = C.ink, size = 9 } = opts
  setBold(doc, size)
  doc.setTextColor(...color)
  const lines = doc.splitTextToSize(text, PAGE.CW - indent)
  doc.text(lines, PAGE.M + indent, y)
  return y + lines.length * 5.2
}

// ── Label / Value cell ──────────────────────────────────────────────────────

export function labelValue(doc, lbl, val, x, y, opts = {}) {
  const { labelSize = 6.5, valueSize = 10, valueFont = 'times' } = opts
  setLabel(doc, labelSize)
  doc.setTextColor(...C.muted)
  doc.text(lbl.toUpperCase(), x, y)
  doc.setFont(valueFont, 'bold')
  doc.setFontSize(valueSize)
  doc.setTextColor(...C.navy)
  doc.text(String(val ?? '—'), x, y + 5)
  return y + 11
}

// ── Metric card ─────────────────────────────────────────────────────────────

export function metricCard(doc, lbl, val, sub, x, y, w, h, opts = {}) {
  const { bg = C.surface, accentColor } = opts
  doc.setFillColor(...bg)
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'F')
  if (accentColor) {
    doc.setFillColor(...accentColor)
    doc.rect(x, y, w, 1.8, 'F')
  }
  setLabel(doc, 6.5)
  doc.setTextColor(...C.muted)
  doc.text(lbl.toUpperCase(), x + 4, y + 8)
  setDisplay(doc, 14)
  doc.setTextColor(...C.navy)
  doc.text(String(val ?? '—'), x + 4, y + 17)
  if (sub) {
    setBody(doc, 7)
    doc.setTextColor(...C.muted)
    const subLines = doc.splitTextToSize(sub, w - 8)
    doc.text(subLines, x + 4, y + 22)
  }
}

// ── Wide metric card (tall version) ────────────────────────────────────────

export function heroMetric(doc, lbl, val, sub, x, y, w) {
  const h = 28
  doc.setFillColor(...C.surface)
  doc.roundedRect(x, y, w, h, 2, 2, 'F')
  doc.setFillColor(...C.gold)
  doc.rect(x, y, w, 2, 'F')
  setLabel(doc, 6.5)
  doc.setTextColor(...C.muted)
  doc.text(lbl.toUpperCase(), x + 5, y + 9)
  setDisplay(doc, 18)
  doc.setTextColor(...C.navy)
  doc.text(String(val ?? '—'), x + 5, y + 21)
  if (sub) {
    setBody(doc, 7.5)
    doc.setTextColor(...C.slate)
    doc.text(sub, x + 5, y + 26)
  }
  return y + h + 4
}

// ── Progress bar ────────────────────────────────────────────────────────────

export function progressBar(doc, lbl, value, max, y, opts = {}) {
  const { unit = '%', fillColor, limitPct } = opts
  const BAR_H = 3
  const BAR_W = PAGE.CW

  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const fill = fillColor ?? (pct > 0.85 ? C.riskAc : pct > 0.6 ? C.warningAc : C.successAc)

  setLabel(doc, 7)
  doc.setTextColor(...C.slate)
  doc.text(lbl, PAGE.M, y)

  setBold(doc, 8)
  doc.setTextColor(...C.navy)
  const valStr = typeof value === 'number' ? `${value.toFixed(1)}${unit}` : `${value}${unit}`
  doc.text(valStr, PAGE.W - PAGE.M, y, { align: 'right' })

  // Track
  doc.setFillColor(...C.border)
  doc.roundedRect(PAGE.M, y + 2.5, BAR_W, BAR_H, 1, 1, 'F')

  // Fill
  doc.setFillColor(...fill)
  doc.roundedRect(PAGE.M, y + 2.5, BAR_W * pct, BAR_H, 1, 1, 'F')

  // Limit marker
  if (limitPct != null) {
    const lx = PAGE.M + BAR_W * limitPct
    doc.setDrawColor(...C.riskAc)
    doc.setLineWidth(0.4)
    doc.line(lx, y + 1.5, lx, y + 2.5 + BAR_H + 1)
    setBody(doc, 6)
    doc.setTextColor(...C.riskTx)
    doc.text('limit', lx - 2, y + 2.5 + BAR_H + 4)
  }

  return y + BAR_H + 10
}

// ── Table row ───────────────────────────────────────────────────────────────

export function tableRow(doc, cols, y, colWidths, opts = {}) {
  const { bg, bold = false, borderTop = false, size = 8.5 } = opts
  if (bg) {
    doc.setFillColor(...bg)
    doc.rect(PAGE.M, y - 4.5, PAGE.CW, 7.5, 'F')
  }
  if (borderTop) {
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.15)
    doc.line(PAGE.M, y - 4.5, PAGE.W - PAGE.M, y - 4.5)
  }
  let x = PAGE.M
  cols.forEach((text, i) => {
    const w = colWidths[i]
    const align = i > 0 ? 'right' : 'left'
    if (bold || i === 0) setBold(doc, size)
    else setBody(doc, size)
    doc.setTextColor(...(bold ? C.navy : i === 0 ? C.slate : C.ink))
    const txt = String(text ?? '—')
    doc.text(txt, align === 'right' ? x + w : x, y, { align })
    x += w + 2
  })
  return y + 7
}

// ── Callout box ─────────────────────────────────────────────────────────────

export function calloutBox(doc, text, y, opts = {}) {
  const { bg = C.brandLight, tx = C.brand, icon = '▸', w = PAGE.CW } = opts
  const innerW = w - 16
  const lines = doc.splitTextToSize(text, innerW)
  const h = lines.length * 5 + 10
  doc.setFillColor(...bg)
  doc.roundedRect(PAGE.M, y, w, h, 2, 2, 'F')
  doc.setFillColor(...tx)
  doc.rect(PAGE.M, y, 2.5, h, 'F')
  setBold(doc, 7.5)
  doc.setTextColor(...tx)
  doc.text(icon, PAGE.M + 5.5, y + 6.5)
  setBody(doc, 8.5)
  doc.setTextColor(...tx)
  doc.text(lines, PAGE.M + 10, y + 6.5)
  return y + h + 4
}

// ── Formatters (self-contained) ─────────────────────────────────────────────

export function czk(n) {
  if (!n || n <= 0) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'CZK', currencyDisplay: 'code', maximumFractionDigits: 0,
  }).format(n)
}

export function czkShort(n) {
  if (!n || n <= 0) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M CZK`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K CZK`
  return `${Math.round(n)} CZK`
}

export function pct(n, dec = 1) {
  if (n == null || n === 0) return '—'
  return `${Number(n).toFixed(dec)}%`
}

export function entityLabel(t) {
  return { zamestnanec: 'Salaried Employee', osvc: 'Self-Employed (Sole Trader)', sro: 'Company Director (s.r.o.)', other: 'Other / Complex' }[t] ?? '—'
}

export function residenceLabel(r) {
  return {
    eu: 'EU / EEA Citizen', permanent: 'Permanent Residence',
    longterm5plus: 'Long-term Residence 5+ yrs', longterm: 'Long-term Residence <5 yrs',
    employment: 'Long-term Work / Business Permit', other: 'Other / Student',
  }[r] ?? (r ?? '—')
}

export function tenureLabel(t) {
  return { 'less1': '<1 year', '1-2': '1–2 years', '2-5': '2–5 years', '5-10': '5–10 years', '10plus': '10+ years' }[t] ?? (t ?? '—')
}

export function contractLabel(c) {
  return { indefinite: 'Indefinite Contract', definite: 'Fixed-term Contract', agency: 'Agency / Temp', dpc: 'Supplemental Agreement' }[c] ?? '—'
}

export function purposeLabel(p) {
  return { primary: 'Primary Residence', investment: 'Investment / Rental', holiday: 'Holiday / Second Home' }[p] ?? '—'
}

export function scoreColor(s) {
  if (s >= 75) return C.successAc
  if (s >= 55) return C.brand
  if (s >= 35) return C.warningAc
  return C.riskAc
}

export function scoreLabel(s) {
  if (s >= 75) return 'STRONG APPLICANT'
  if (s >= 55) return 'GOOD STANDING'
  if (s >= 35) return 'NEEDS REVIEW'
  return 'HIGH RISK'
}

export const BANK_DISPLAY = {
  mbank: 'mBank', kb: 'Komerční banka', csob: 'ČSOB',
  cs: 'Česká spořitelna', rb: 'Raiffeisenbank', ucb: 'UniCredit',
}

export const BANK_KEYS = ['mbank', 'kb', 'csob', 'cs', 'rb', 'ucb']
