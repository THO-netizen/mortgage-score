import {
  C, PAGE, pageHeader, pageFooter, sectionHeader, hRule, thinRule,
  bodyText, setBold, setLabel, setBody, setDisplay, czk, czkShort,
  entityLabel, residenceLabel, tenureLabel, contractLabel, purposeLabel,
} from '../styles.js'

export function drawApplicantSnapshotPage(doc, ctx) {
  const { formData, profile, score, pageNum, totalPages } = ctx
  const {
    leadName, entityType, residenceStatus, yearsInCZ, applicantAge,
    purchasePrice, ownFunds, propertyPurpose, taxRegime,
    annualTurnover, avgMonthlyCreditTurnover, turnoverIncomePct,
    naceSector, businessName, businessAgeMonths, icoActiveStatus,
    contractType, employmentSector, netMonthlySalary,
    existingDebt: fdDebt, monthlyLoanPayments, creditCardLimits,
  } = formData
  const { effectiveIncome, existingDebt, ltvPct, flags = [], redFlags = [] } = profile

  pageHeader(doc, 'Applicant Snapshot', pageNum, totalPages)
  pageFooter(doc)

  let y = 20
  const M = PAGE.M
  const CW = PAGE.CW
  const HALF = (CW - 3) / 2

  y = sectionHeader(doc, 'Applicant Profile Snapshot', 'Identity, income structure, and property parameters', y)

  // ── Identity block ────────────────────────────────────
  drawSectionLabel(doc, 'PERSONAL IDENTITY', y)
  y += 5.5

  const identityRows = [
    ['Full Name',           leadName || '—',             'Income Type',      entityLabel(entityType)],
    ['Applicant Age',       applicantAge ? `${applicantAge} years` : '—', 'Residence Status', residenceLabel(residenceStatus)],
    ['Time in Czechia',     tenureLabel(yearsInCZ),      'Business / Employer', businessName || '—'],
  ]

  identityRows.forEach(([lbl1, val1, lbl2, val2]) => {
    drawPairRow(doc, lbl1, val1, lbl2, val2, y, M, HALF)
    y += 12
  })

  y = thinRule(doc, y)

  // ── Income block ──────────────────────────────────────
  drawSectionLabel(doc, 'INCOME PROFILE', y)
  y += 5.5

  if (entityType === 'osvc') {
    const method = flags.includes('flat_tax_method') ? 'Method B — Bank Turnover (Flat Tax Regime)' : 'Method A — Annual Turnover (Tax Return)'
    const coeff  = `${turnoverIncomePct ?? 70}% income recognition`
    const raw    = flags.includes('flat_tax_method')
      ? czk(Number(avgMonthlyCreditTurnover ?? 0))
      : czk(Number(annualTurnover ?? 0))
    const rawLbl = flags.includes('flat_tax_method') ? 'Avg. Monthly Turnover' : 'Gross Annual Turnover'

    const incRows = [
      ['Recognition Method',  method,             'Sector / NACE',    naceSector || 'Not resolved'],
      [rawLbl,                raw,                'Income Coefficient', coeff],
      ['Business History',    businessAgeMonths != null ? `Active for ${fmtAge(businessAgeMonths)}` : 'Not verified', 'ARES Status', icoActiveStatus === 'AKTIVNÍ' ? 'Verified — Active' : icoActiveStatus || 'Not verified'],
      ['Recognised Income',   czk(effectiveIncome) + '/mo', 'Income Cap', '150,000 CZK / mo'],
    ]
    incRows.forEach(([l1, v1, l2, v2]) => {
      drawPairRow(doc, l1, v1, l2, v2, y, M, HALF)
      y += 12
    })
  } else if (entityType === 'zamestnanec') {
    const sectorMap = { health: 'Healthcare', education: 'Education', other: 'Private Sector' }
    const incRows = [
      ['Contract Type',       contractLabel(contractType),   'Employment Sector', sectorMap[employmentSector] ?? '—'],
      ['Net Monthly Salary',  czk(Number(netMonthlySalary ?? 0)), 'Recognised Income', czk(effectiveIncome) + '/mo'],
    ]
    incRows.forEach(([l1, v1, l2, v2]) => {
      drawPairRow(doc, l1, v1, l2, v2, y, M, HALF)
      y += 12
    })
  }

  y = thinRule(doc, y)

  // ── Obligations block ─────────────────────────────────
  drawSectionLabel(doc, 'MONTHLY OBLIGATIONS', y)
  y += 5.5

  const creditCard5 = Math.round(Number(creditCardLimits || 0) * 0.05)
  const oblRows = [
    ['Loan Repayments / mo', czk(Number(monthlyLoanPayments || 0)), 'Credit Card 5% Rule', czk(creditCard5)],
    ['Total Obligations / mo', czk(existingDebt ?? 0),             'DSTI Headroom',       '45% ceiling'],
  ]
  oblRows.forEach(([l1, v1, l2, v2]) => {
    drawPairRow(doc, l1, v1, l2, v2, y, M, HALF)
    y += 12
  })

  y = thinRule(doc, y)

  // ── Property block ────────────────────────────────────
  drawSectionLabel(doc, 'PROPERTY & FINANCING', y)
  y += 5.5

  const loanAmt = Math.max(0, (purchasePrice || 0) - (ownFunds || 0))
  const propRows = [
    ['Purchase Price',   czk(purchasePrice),        'Property Purpose',    purposeLabel(propertyPurpose)],
    ['Own Funds',        czk(ownFunds),             'Loan Amount',         czk(loanAmt)],
    ['LTV Ratio',        ltvPct > 0 ? `${ltvPct.toFixed(1)}%` : '—', 'Max LTV (Regulatory)', profile.maxLTVPct ? `${profile.maxLTVPct}%` : '—'],
  ]
  propRows.forEach(([l1, v1, l2, v2]) => {
    drawPairRow(doc, l1, v1, l2, v2, y, M, HALF)
    y += 12
  })

  // ── Flags summary ─────────────────────────────────────
  if (redFlags.length > 0) {
    y += 2
    doc.setFillColor(...C.riskBg)
    const flagH = redFlags.length * 6 + 12
    doc.roundedRect(M, y, CW, flagH, 1.5, 1.5, 'F')
    doc.setFillColor(...C.riskAc)
    doc.rect(M, y, 2.5, flagH, 'F')

    setBold(doc, 7.5)
    doc.setTextColor(...C.riskTx)
    doc.text(`${redFlags.length} Hard-Block Flag${redFlags.length > 1 ? 's' : ''} Require Resolution`, M + 7, y + 7)

    redFlags.forEach((f, i) => {
      setBody(doc, 7.5)
      doc.setTextColor(...C.riskTx)
      doc.text(`• ${formatFlag(f)}`, M + 7, y + 13 + i * 5.5)
    })
  }
}

// ── Sub-helpers ───────────────────────────────────────────────────────────────

function drawSectionLabel(doc, text, y) {
  setLabel(doc, 7)
  doc.setTextColor(...C.gold)
  doc.text(text, PAGE.M, y)
}

function drawPairRow(doc, lbl1, val1, lbl2, val2, y, M, HALF) {
  setLabel(doc, 6.5)
  doc.setTextColor(...C.muted)
  doc.text(lbl1.toUpperCase(), M, y)
  if (lbl2) doc.text(lbl2.toUpperCase(), M + HALF + 3, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C.navy)
  doc.text(String(val1 ?? '—'), M, y + 5)
  if (val2) doc.text(String(val2), M + HALF + 3, y + 5)
}

function fmtAge(months) {
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y > 0 && m > 0) return `${y} yr ${m} mo`
  if (y > 0) return `${y} yr`
  return `${m} mo`
}

function formatFlag(f) {
  const MAP = {
    notice_period:            'Active notice period — hard block at all Czech banks',
    probation:                'Probation period — most banks will decline',
    osvc_inactive_licence:    'Trade licence inactive — income cannot be recognised',
    business_too_new:         'Business under 6 months — transition path required',
    sro_negative_financials:  'Company negative equity / loss — ESSO income blocked',
    sro_insufficient_history: 'Company history under 12 months — ESSO income blocked',
    sick_leave:               'On sick leave — most banks require return to active employment',
    employer_distressed:      'Employer distress flag — lenders will request additional evidence',
  }
  return MAP[f] ?? f.replace(/_/g, ' ')
}
