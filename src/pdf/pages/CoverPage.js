import { C, PAGE, setDisplay, setHeading, setLabel, setBody, setBold, scoreColor, scoreLabel, czk, czkShort, entityLabel } from '../styles.js'

export function drawCoverPage(doc, ctx) {
  const { formData, profile, score, today } = ctx
  const { leadName, entityType, purchasePrice } = formData
  const { eX } = profile

  const W = PAGE.W
  const H = PAGE.H
  const M = PAGE.M

  // ── Full navy background ──────────────────────────────
  doc.setFillColor(...C.navy)
  doc.rect(0, 0, W, H, 'F')

  // ── Gold accent strip (left edge) ────────────────────
  doc.setFillColor(...C.gold)
  doc.rect(0, 0, 4, H, 'F')

  // ── Logo / wordmark ───────────────────────────────────
  setLabel(doc, 8.5)
  doc.setTextColor(...C.gold)
  doc.text('MORTGAGE SCORE', M + 2, 28)

  doc.setDrawColor(...C.gold)
  doc.setLineWidth(0.3)
  doc.line(M + 2, 31, M + 2 + 55, 31)

  setBody(doc, 8)
  doc.setTextColor(...C.muted)
  doc.text('Czech Republic Mortgage Eligibility Assessment', M + 2, 37)

  // ── Applicant name ────────────────────────────────────
  setDisplay(doc, 28)
  doc.setTextColor(...C.white)
  const name = (leadName ?? 'Applicant').toUpperCase()
  doc.text(name, M + 2, 80)

  setBody(doc, 9.5)
  doc.setTextColor(...C.muted)
  doc.text(entityLabel(entityType), M + 2, 88)

  // ── Thin separator ────────────────────────────────────
  doc.setDrawColor(...[50, 65, 90])
  doc.setLineWidth(0.2)
  doc.line(M + 2, 96, W - M - 2, 96)

  // ── Key metrics block ─────────────────────────────────
  const metrics = [
    { label: 'Max Loan Capacity',  value: czkShort(eX) },
    { label: 'Purchase Price',     value: purchasePrice > 0 ? czkShort(purchasePrice) : '—' },
    { label: 'Date of Assessment', value: today },
  ]

  let my = 108
  metrics.forEach(({ label, value }) => {
    setLabel(doc, 6.5)
    doc.setTextColor(...C.gold)
    doc.text(label.toUpperCase(), M + 2, my)
    my += 5
    setDisplay(doc, 12)
    doc.setTextColor(...C.white)
    doc.text(value, M + 2, my)
    my += 10
  })

  // ── Score circle ──────────────────────────────────────
  const cx = W - M - 28
  const cy = 130
  const r  = 28

  // Outer ring (subtle)
  doc.setDrawColor(...[50, 65, 90])
  doc.setLineWidth(0.5)
  doc.circle(cx, cy, r, 'S')

  // Coloured inner disc
  doc.setFillColor(...scoreColor(score))
  doc.circle(cx, cy, r - 3, 'F')

  // Score number
  setDisplay(doc, 28)
  doc.setTextColor(...C.white)
  doc.text(String(score), cx, cy + 6, { align: 'center' })
  setLabel(doc, 6)
  doc.setTextColor(...C.white)
  doc.text('/100', cx, cy + 13, { align: 'center' })

  // Score label below circle
  setLabel(doc, 7)
  doc.setTextColor(...scoreColor(score))
  doc.text(scoreLabel(score), cx, cy + r + 7, { align: 'center' })

  // ── Disclaimer ────────────────────────────────────────
  doc.setDrawColor(...[50, 65, 90])
  doc.setLineWidth(0.15)
  doc.line(M + 2, H - 28, W - M - 2, H - 28)

  setBody(doc, 7)
  doc.setTextColor(...C.muted)
  const disclaimer = 'This assessment reflects 2026 Czech bank underwriting methodology and is indicative only. It does not constitute financial advice or a guarantee of mortgage approval. Produced by MortgageScore.cz.'
  const dLines = doc.splitTextToSize(disclaimer, W - M * 2 - 4)
  doc.text(dLines, M + 2, H - 22)

  setLabel(doc, 6.5)
  doc.setTextColor(...C.gold)
  doc.text('Andy Le — Mortgage & Property Financing Specialist', M + 2, H - 8)
  doc.text('MortgageScore.cz', W - M - 2, H - 8, { align: 'right' })
}
