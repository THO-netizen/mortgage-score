import {
  C, PAGE, pageHeader, pageFooter, sectionHeader, hRule, accentRule,
  bodyText, setBold, setBody, setLabel, setDisplay, setHeading,
  calloutBox, scoreColor, scoreLabel, czk, czkShort,
} from '../styles.js'
import { buildFinalSummary } from '../narrative.js'

export function drawFinalSummaryPage(doc, ctx) {
  const { formData, profile, score, today, pageNum, totalPages } = ctx
  const { eX, eXStress, effectiveIncome, redFlags = [] } = profile
  const { leadName } = formData

  pageHeader(doc, 'Final Summary', pageNum, totalPages)
  pageFooter(doc)

  let y = 20
  const M = PAGE.M
  const CW = PAGE.CW

  y = sectionHeader(doc, 'Assessment Summary',
    'Key findings, conclusions, and recommended next steps', y)

  // ── Score panel ───────────────────────────────────────
  doc.setFillColor(...C.navy)
  doc.roundedRect(M, y, CW, 28, 2, 2, 'F')
  doc.setFillColor(...scoreColor(score))
  doc.rect(M, y, 4, 28, 'F')

  const halfW = (CW - 8) / 2

  setLabel(doc, 6.5)
  doc.setTextColor(...C.muted)
  doc.text('READINESS SCORE', M + 8, y + 8)
  setDisplay(doc, 18)
  doc.setTextColor(...C.white)
  doc.text(`${score} / 100`, M + 8, y + 20)

  setLabel(doc, 6.5)
  doc.setTextColor(...C.muted)
  doc.text('MAX LOAN CAPACITY', M + 8 + halfW, y + 8)
  setDisplay(doc, 18)
  doc.setTextColor(...C.white)
  doc.text(czkShort(eX), M + 8 + halfW, y + 20)

  setLabel(doc, 6.5)
  doc.setTextColor(...scoreColor(score))
  doc.text(scoreLabel(score), M + 8, y + 26)

  setLabel(doc, 6.5)
  doc.setTextColor(...C.muted)
  doc.text(`Stress-tested: ${czkShort(eXStress)}`, M + 8 + halfW, y + 26)

  y += 34

  // ── Key findings bullets ──────────────────────────────
  setLabel(doc, 7)
  doc.setTextColor(...C.gold)
  doc.text('KEY FINDINGS', M, y)
  y += 7

  const bullets = buildFinalSummary(formData, profile, score)

  bullets.forEach((text, i) => {
    const lines = doc.splitTextToSize(text, CW - 10)
    const bH = lines.length * 5 + 8

    doc.setFillColor(...(i % 2 === 0 ? C.surface : C.white))
    doc.roundedRect(M, y, CW, bH, 1, 1, 'F')

    // Number badge
    doc.setFillColor(...C.navy)
    doc.circle(M + 5, y + bH / 2, 3.5, 'F')
    setBold(doc, 7)
    doc.setTextColor(...C.white)
    doc.text(String(i + 1), M + 5, y + bH / 2 + 1.5, { align: 'center' })

    setBody(doc, 8.5)
    doc.setTextColor(...C.slate)
    doc.text(lines, M + 13, y + 6)

    y += bH + 3
  })

  y = hRule(doc, y)

  // ── Next steps ────────────────────────────────────────
  setLabel(doc, 7)
  doc.setTextColor(...C.gold)
  doc.text('NEXT STEPS', M, y)
  y += 7

  const nextSteps = [
    'Review the Recommendations section and identify which actions apply to your timeline.',
    'Book a 45-minute strategy session to map this profile to the optimal lender and initiate the pre-approval process.',
    'Prepare the standard document package (income evidence, identity documents, property details).',
    'Receive your pre-approval letter — typically within 2–3 weeks of submission.',
  ]

  nextSteps.forEach((step, i) => {
    const lines = doc.splitTextToSize(`${i + 1}.  ${step}`, CW - 4)
    setBody(doc, 9)
    doc.setTextColor(...C.slate)
    doc.text(lines, M, y)
    y += lines.length * 5.5 + 2
  })

  y += 4
  y = hRule(doc, y)

  // ── CTA block ─────────────────────────────────────────
  doc.setFillColor(...C.navy)
  doc.roundedRect(M, y, CW, 36, 2, 2, 'F')
  doc.setFillColor(...C.gold)
  doc.rect(M, y, CW, 2, 'F')

  setDisplay(doc, 12)
  doc.setTextColor(...C.white)
  doc.text('Book Your Strategy Session', M + 6, y + 13)

  setBody(doc, 8.5)
  doc.setTextColor(...C.muted)
  doc.text(
    'A personalised 45-minute session will identify the best lender for your profile, review documentation, and initiate the pre-approval process.',
    M + 6, y + 20,
  )
  const ctaW = CW - 12
  const ctaLines = doc.splitTextToSize(
    'A personalised 45-minute session will identify the best lender for your profile, review documentation, and initiate the pre-approval process.',
    ctaW,
  )
  doc.text(ctaLines, M + 6, y + 20)

  setLabel(doc, 8)
  doc.setTextColor(...C.gold)
  doc.text('Andy Le — Mortgage & Property Financing Specialist', M + 6, y + 33)
  setBold(doc, 8)
  doc.setTextColor(...C.muted)
  doc.text('MortgageScore.cz', PAGE.W - M - 6, y + 33, { align: 'right' })

  y += 42

  // ── Disclaimer ────────────────────────────────────────
  setBody(doc, 7)
  doc.setTextColor(...C.muted)
  const disclaimerText = `This report was generated on ${today} based on data provided by the applicant. All figures are indicative estimates based on 2026 Czech bank underwriting methodology and should not be construed as a guarantee of mortgage approval, a lending offer, or financial advice. Actual terms depend on individual bank assessment, property valuation, credit history check, and credit committee approval. Produced by MortgageScore.cz for ${leadName ?? 'the applicant'}.`
  const dLines = doc.splitTextToSize(disclaimerText, CW)
  doc.text(dLines, M, y)
}
