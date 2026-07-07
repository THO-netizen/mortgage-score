import {
  C, PAGE, pageHeader, pageFooter, sectionHeader, hRule, thinRule,
  bodyText, setBold, setBody, setLabel, setHeading, setDisplay,
  scoreColor, scoreLabel, czk, pct,
} from '../styles.js'

export function drawReadinessScorePage(doc, ctx) {
  const { formData, profile, score, pageNum, totalPages } = ctx
  const {
    residenceStatus, yearsInCZ, purchasePrice, ownFunds,
    propertyPurpose, applicantAge, existingDebt: fdDebt, purchaseTimeline,
    entityType, businessAgeMonths, contractType, isProbation, probationPeriod,
    isNoticePeriod,
  } = formData
  const { ltvPct, maxLTVPct, flags = [], redFlags = [], eX, effectiveIncome } = profile

  pageHeader(doc, 'Readiness Score', pageNum, totalPages)
  pageFooter(doc)

  let y = 20
  const M = PAGE.M
  const CW = PAGE.CW

  y = sectionHeader(doc, 'Mortgage Readiness Score',
    '10-factor eligibility evaluation against Czech bank underwriting criteria', y)

  // ── Score display ─────────────────────────────────────
  const sColor = scoreColor(score)
  const cx = PAGE.W - M - 22
  const cy = y + 18

  // Outer ring
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.4)
  doc.circle(cx, cy, 20, 'S')

  // Inner disc
  doc.setFillColor(...sColor)
  doc.circle(cx, cy, 17, 'F')

  // Score text
  setDisplay(doc, 20)
  doc.setTextColor(...C.white)
  doc.text(String(score), cx, cy + 5, { align: 'center' })
  setBody(doc, 7.5)
  doc.setTextColor(...C.white)
  doc.text('/100', cx, cy + 12, { align: 'center' })

  // Label under circle
  setLabel(doc, 7.5)
  doc.setTextColor(...sColor)
  doc.text(scoreLabel(score), cx, cy + 25, { align: 'center' })

  // Tier scale (left of circle)
  const tiers = [
    { label: '75–100 · Strong Applicant',  color: C.successAc },
    { label: '55–74  · Good Standing',     color: C.brand     },
    { label: '35–54  · Needs Review',      color: C.warningAc },
    { label: '0–34   · High Risk',         color: C.riskAc    },
  ]
  let ty = y + 6
  tiers.forEach(({ label, color }) => {
    doc.setFillColor(...color)
    doc.circle(M + 4, ty, 2.5, 'F')
    setBody(doc, 8)
    doc.setTextColor(...C.slate)
    doc.text(label, M + 10, ty + 1)
    ty += 9
  })

  y = cy + 32

  y = hRule(doc, y)

  // ── Factor breakdown table ────────────────────────────
  setLabel(doc, 7)
  doc.setTextColor(...C.gold)
  doc.text('ELIGIBILITY FACTOR BREAKDOWN', M, y)
  y += 7

  const factors = buildFactors(formData, profile, score)

  // Table header
  doc.setFillColor(...C.navyMid)
  doc.rect(M, y - 4.5, CW, 7.5, 'F')
  setBold(doc, 7.5)
  doc.setTextColor(...C.white)
  doc.text('Factor', M + 3, y)
  doc.text('Detail', M + 70, y)
  doc.text('Status', PAGE.W - M - 3, y, { align: 'right' })
  y += 7.5

  factors.forEach(({ title, detail, status }, i) => {
    const bg = i % 2 === 0 ? C.surface : C.white
    doc.setFillColor(...bg)
    doc.rect(M, y - 4.5, CW, 7.5, 'F')

    // Status dot
    const dotColor = status === 'strong' ? C.successAc : status === 'good' ? C.brand : status === 'review' ? C.warningAc : C.riskAc
    doc.setFillColor(...dotColor)
    doc.circle(M + 3, y - 0.5, 2, 'F')

    setBody(doc, 8)
    doc.setTextColor(...C.navy)
    doc.text(title, M + 8, y)

    setBody(doc, 7.5)
    doc.setTextColor(...C.slate)
    const detailTxt = doc.splitTextToSize(String(detail ?? '—'), 78)
    doc.text(detailTxt[0] ?? '', M + 70, y)

    // Status label
    setBold(doc, 7)
    doc.setTextColor(...dotColor)
    const statusStr = { strong: 'Strong', good: 'Good', review: 'Review', risk: 'Risk' }[status] ?? status
    doc.text(statusStr.toUpperCase(), PAGE.W - M - 3, y, { align: 'right' })

    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.1)
    doc.line(M, y + 3, M + CW, y + 3)

    y += 7.5
  })

  y += 4

  // ── Score interpretation ──────────────────────────────
  y = hRule(doc, y)
  setLabel(doc, 7)
  doc.setTextColor(...C.gold)
  doc.text('SCORE INTERPRETATION', M, y)
  y += 7

  const interp = score >= 75
    ? `A score of ${score}/100 reflects a strong mortgage applicant profile. All primary eligibility criteria are satisfied, income recognition is robust, and the property structure is within regulatory limits. Standard underwriting pathways are available at the majority of covered Czech lenders.`
    : score >= 55
    ? `A score of ${score}/100 reflects a good-standing profile with targeted areas for improvement. The core income and property criteria are met, with some factors that require attention or lender-specific routing. Pre-approval is achievable with the right lender selection strategy.`
    : score >= 35
    ? `A score of ${score}/100 places this profile in the review category. Meaningful structural or documentation issues exist that will limit lender eligibility and require targeted remediation. The Recommendations section outlines specific actions to improve this score within 3–6 months.`
    : `A score of ${score}/100 indicates significant barriers to standard Czech mortgage approval. Active risk flags and structural constraints prevent most lenders from processing this application in its current form. A structured preparation plan — detailed in the Recommendations section — is the recommended next step.`

  y = bodyText(doc, interp, y, { size: 9, lineH: 5.2 })
}

// ── Factor builder ────────────────────────────────────────────────────────────

function buildFactors(formData, profile, score) {
  const {
    residenceStatus, yearsInCZ, entityType, businessAgeMonths,
    purchasePrice, ownFunds, propertyPurpose, applicantAge,
    contractType, isProbation, probationPeriod, isNoticePeriod,
    purchaseTimeline,
  } = formData
  const { ltvPct, maxLTVPct, existingDebt, maturity, eX, flags = [], redFlags = [] } = profile

  const own = purchasePrice > 0 ? ((ownFunds ?? 0) / purchasePrice) * 100 : 0
  const inProbation = isProbation || probationPeriod === 'yes'

  const f = []

  f.push({
    title:  'Residence & Visa',
    detail: { eu: 'EU/EEA', permanent: 'Permanent Residence', longterm5plus: 'LT Residence 5+', longterm: 'LT Residence', employment: 'Work Permit', other: 'Other' }[residenceStatus] ?? '—',
    status: !residenceStatus ? 'review' : (residenceStatus === 'eu' || residenceStatus === 'permanent') ? 'strong' : (residenceStatus === 'longterm5plus' || residenceStatus === 'longterm') ? 'good' : 'risk',
  })
  f.push({
    title:  'Time in Czechia',
    detail: { 'less1': '<1 yr', '1-2': '1–2 yr', '2-5': '2–5 yr', '5-10': '5–10 yr', '10plus': '10+ yr' }[yearsInCZ] ?? '—',
    status: !yearsInCZ ? 'review' : (yearsInCZ === '10plus' || yearsInCZ === '5-10') ? 'strong' : yearsInCZ === '2-5' ? 'good' : yearsInCZ === '1-2' ? 'review' : 'risk',
  })
  f.push({
    title:  'Employment / Business',
    detail: entityType === 'osvc' ? (businessAgeMonths != null ? `Self-Employed ${businessAgeMonths}mo` : 'Self-Employed') : entityType === 'zamestnanec' ? (contractType ?? 'Employee') : 'Director s.r.o.',
    status: redFlags.some(r => ['notice_period', 'probation', 'sick_leave', 'employer_distressed', 'osvc_inactive_licence', 'business_too_new', 'sro_negative_financials', 'sro_insufficient_history'].includes(r)) ? 'risk'
          : entityType === 'osvc' && businessAgeMonths != null && businessAgeMonths < 24 ? 'review'
          : inProbation ? 'review'
          : 'strong',
  })
  f.push({
    title:  'LTV Position',
    detail: ltvPct > 0 ? `${ltvPct.toFixed(1)}% (limit ${maxLTVPct}%)` : '—',
    status: !purchasePrice ? 'review' : ltvPct > maxLTVPct ? 'risk' : ltvPct > 70 ? 'good' : 'strong',
  })
  f.push({
    title:  'Own Funds',
    detail: own > 0 ? `${own.toFixed(0)}% of purchase price` : '—',
    status: !purchasePrice ? 'review' : own >= 30 ? 'strong' : own >= 20 ? 'good' : 'risk',
  })
  f.push({
    title:  'Existing Debt Load',
    detail: existingDebt > 0 ? `${czk(existingDebt)}/mo obligations` : 'No existing debt',
    status: existingDebt === 0 ? 'strong' : existingDebt < 15_000 ? 'good' : existingDebt < 30_000 ? 'review' : 'risk',
  })
  f.push({
    title:  'Property Purpose',
    detail: { primary: 'Primary Residence', investment: 'Investment', holiday: 'Holiday Home' }[propertyPurpose] ?? '—',
    status: propertyPurpose === 'primary' ? 'strong' : propertyPurpose === 'investment' ? 'good' : 'review',
  })
  f.push({
    title:  'Loan Term Capacity',
    detail: maturity?.maxYears ? `Max ${maturity.maxYears} yrs (payoff age ${Number(applicantAge || 35) + maturity.maxYears})` : '—',
    status: (maturity?.maxYears ?? 0) >= 25 ? 'strong' : (maturity?.maxYears ?? 0) >= 15 ? 'good' : (maturity?.maxYears ?? 0) >= 10 ? 'review' : 'risk',
  })
  f.push({
    title:  'Income Quality',
    detail: eX > 0 ? `E[X] = ${(eX / 1_000_000).toFixed(2)}M CZK` : 'No income entered',
    status: eX > 3_000_000 ? 'strong' : eX > 1_500_000 ? 'good' : eX > 500_000 ? 'review' : 'risk',
  })
  f.push({
    title:  'Purchase Readiness',
    detail: { '3months': 'Within 3 months', '6months': 'Within 6 months', '12months': '6–12 months', exploring: 'Exploring' }[purchaseTimeline] ?? '—',
    status: purchaseTimeline === '6months' ? 'strong' : (purchaseTimeline === '3months' || purchaseTimeline === '12months') ? 'good' : 'review',
  })

  return f
}
