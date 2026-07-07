import {
  C, PAGE, pageHeader, pageFooter, sectionHeader, hRule, thinRule,
  bodyText, setBold, setBody, setLabel, setDisplay, calloutBox,
  czk, czkShort, pct,
} from '../styles.js'

export function drawIncomeRecognitionPage(doc, ctx) {
  const { formData, profile, pageNum, totalPages } = ctx
  const {
    entityType, taxRegime, annualTurnover, avgMonthlyCreditTurnover,
    turnoverIncomePct, naceSector, businessAgeMonths,
    netMonthlySalary, contractType, hasFxIncome, foreignSalaryAmount,
    foreignSalaryCurrency, hasBonus, bonusAmount, bonusFrequency,
    monthlyDiety, hasMonthlyDiety,
  } = formData
  const { effectiveIncome, flags = [] } = profile

  pageHeader(doc, 'Income Recognition', pageNum, totalPages)
  pageFooter(doc)

  let y = 20
  const M = PAGE.M
  const CW = PAGE.CW
  const HALF = (CW - 4) / 2

  y = sectionHeader(doc, 'Income Recognition Analysis',
    entityType === 'osvc' ? 'Czech bank NACE methodology — Method A vs. Method B comparison'
    : entityType === 'sro' ? 'ESSO Director income — per-stream assessment'
    : 'Salaried income — recognition and adjustments', y)

  if (entityType === 'osvc') {
    // ── OSVČ ──────────────────────────────────────────────
    const coeff    = (turnoverIncomePct ?? 70) / 100
    const coeffPct = `${turnoverIncomePct ?? 70}%`
    const annNum   = Number(annualTurnover ?? 0)
    const mthNum   = Number(avgMonthlyCreditTurnover ?? 0)

    const methodAIncome = annNum > 0
      ? Math.min(Math.round(annNum / 12 * coeff), 150_000)
      : null
    const methodBIncome = mthNum > 0
      ? Math.min(Math.round(mthNum * coeff), 150_000)
      : null

    const activeMethod = flags.includes('flat_tax_method') ? 'B' : 'A'
    const haircut = businessAgeMonths != null && businessAgeMonths < 12 ? 0.70
                  : businessAgeMonths != null && businessAgeMonths < 24 ? 0.85
                  : 1.0

    // Sector card
    doc.setFillColor(...C.surface)
    doc.roundedRect(M, y, CW, 18, 1.5, 1.5, 'F')
    doc.setFillColor(...C.gold)
    doc.rect(M, y, CW, 1.5, 'F')
    setLabel(doc, 6.5)
    doc.setTextColor(...C.muted)
    doc.text('NACE SECTOR & INCOME COEFFICIENT', M + 4, y + 7)
    setDisplay(doc, 10)
    doc.setTextColor(...C.navy)
    doc.text(`${naceSector || 'Not resolved'} — ${coeffPct} income recognition coefficient`, M + 4, y + 14)
    y += 22

    // Two-column method comparison
    drawMethodCard(doc, 'A', 'Tax Return (DAP)', M, y, HALF, {
      active: activeMethod === 'A',
      desc: `Annual Turnover ÷ 12 × ${coeffPct} recognition rate. Based on declared gross revenues in the annual tax return, Appendix 1.`,
      rows: annNum > 0 ? [
        ['Annual turnover',      czk(annNum) + ' / yr'],
        [`Monthly turnover base`, czk(Math.round(annNum / 12)) + ' / mo'],
        [`After ${coeffPct} coefficient`, czk(Math.min(Math.round(annNum / 12 * coeff), 150_000)) + ' / mo'],
        ['Cap (150,000 CZK)',   methodAIncome === 150_000 ? 'Applied' : 'Not reached'],
      ] : [['Status', 'Annual turnover not entered']],
      result: methodAIncome,
    })

    drawMethodCard(doc, 'B', 'Flat Tax Regime / Bank Turnover', M + HALF + 4, y, HALF, {
      active: activeMethod === 'B',
      desc: `Avg. monthly credit turnover × ${coeffPct} recognition rate. Banks assess inbound business payments over last 3–6 months.`,
      rows: mthNum > 0 ? [
        ['Avg. monthly turnover',   czk(mthNum) + ' / mo'],
        [`After ${coeffPct} coefficient`, czk(Math.min(Math.round(mthNum * coeff), 150_000)) + ' / mo'],
        ['Cap (150,000 CZK)',      methodBIncome === 150_000 ? 'Applied' : 'Not reached'],
      ] : [['Status', taxRegime === 'flat_tax' ? 'Monthly turnover not entered' : 'Not applicable for Tax Return']],
      result: methodBIncome,
    })
    y += 68

    // Summary bar
    doc.setFillColor(...C.navy)
    doc.roundedRect(M, y, CW, 20, 1.5, 1.5, 'F')
    setLabel(doc, 7)
    doc.setTextColor(...C.muted)
    doc.text(`RECOGNISED INCOME — METHOD ${activeMethod} APPLIED`, M + 5, y + 7)
    setDisplay(doc, 14)
    doc.setTextColor(...C.white)
    doc.text(`${czk(effectiveIncome)} / month`, M + 5, y + 16)
    setBody(doc, 7.5)
    doc.setTextColor(...C.gold)
    doc.text(`Cap: 150,000 CZK / mo${haircut < 1 ? `  ·  Business age haircut: ${Math.round((1 - haircut) * 100)}% applied` : ''}`, M + CW - 5, y + 16, { align: 'right' })
    y += 26

    // Age haircut note
    if (haircut < 1) {
      y = calloutBox(doc,
        `Business history of ${businessAgeMonths} months triggers a ${Math.round((1 - haircut) * 100)}% income haircut. ` +
        `Without haircut: ${czk(Math.round(effectiveIncome / haircut))}/mo. After haircut: ${czk(effectiveIncome)}/mo. ` +
        `This adjustment is automatically removed once 24 months of continuous trading is confirmed.`,
        y,
        { bg: C.warningBg, tx: C.warningTx, icon: '!' },
      )
    }

  } else if (entityType === 'zamestnanec') {
    // ── Salaried employee ─────────────────────────────────
    const salary  = Number(netMonthlySalary ?? 0)
    const diet    = hasMonthlyDiety ? Number(monthlyDiety ?? 0) * 0.5 : 0
    const fxCZK   = hasFxIncome ? Number(foreignSalaryAmount ?? 0) * 25 * 0.85 : 0
    const bonus   = hasBonus
      ? (bonusFrequency === 'yearly' ? Number(bonusAmount ?? 0) / 12 : Number(bonusAmount ?? 0)) * 0.5
      : 0

    const contractHaircut = contractType === 'agency' ? 0.75 : contractType === 'dpc' ? 0.70 : 1.0
    const rows = [
      ['Net Monthly Salary',            czk(salary),            'Haircut (contract)',       contractHaircut < 1 ? `-${Math.round((1 - contractHaircut) * 100)}%` : 'None'],
      ['Diet / Meal Allowance (50%)',   diet > 0 ? czk(diet) : '—', 'FX Income (85% rate)', fxCZK > 0 ? czk(Math.round(fxCZK)) + '/mo' : '—'],
      ['Bonus Income (50%)',            bonus > 0 ? czk(Math.round(bonus)) + '/mo' : '—', 'Recognised Total', czk(effectiveIncome) + '/mo'],
    ]

    setLabel(doc, 7)
    doc.setTextColor(...C.gold)
    doc.text('SALARY COMPONENT BREAKDOWN', M, y)
    y += 6

    rows.forEach(([l1, v1, l2, v2]) => {
      drawDataRow(doc, l1, v1, M, y)
      drawDataRow(doc, l2, v2, M + (CW - 4) / 2 + 4, y)
      y += 11
    })

    y = hRule(doc, y)

    doc.setFillColor(...C.navy)
    doc.roundedRect(M, y, CW, 20, 1.5, 1.5, 'F')
    setLabel(doc, 7)
    doc.setTextColor(...C.muted)
    doc.text('NET RECOGNISED INCOME (USED IN DSTI CALCULATION)', M + 5, y + 7)
    setDisplay(doc, 14)
    doc.setTextColor(...C.white)
    doc.text(`${czk(effectiveIncome)} / month`, M + 5, y + 16)
    y += 26

    if (contractType === 'agency') {
      y = calloutBox(doc,
        `Agency employment: 25% income haircut applied. Pre-haircut base: ${czk(Math.round(salary + diet + fxCZK + bonus))}/mo → after haircut: ${czk(effectiveIncome)}/mo. Converting to a direct indefinite or fixed-term contract removes this deduction entirely.`,
        y, { bg: C.warningBg, tx: C.warningTx, icon: '!' },
      )
    } else if (contractType === 'dpc') {
      y = calloutBox(doc,
        `Supplemental agreement (DPC): 30% haircut applied. This income stream is treated as secondary by most Czech banks. An indefinite contract is the highest-recognition path.`,
        y, { bg: C.warningBg, tx: C.warningTx, icon: '!' },
      )
    } else {
      y = calloutBox(doc,
        `Indefinite or fixed-term employment: full income recognised without haircut. This is the preferred structure for Czech mortgage underwriting — all major lenders accept the full net salary.`,
        y, { bg: C.successBg, tx: C.successTx, icon: '✓' },
      )
    }

  } else {
    y = bodyText(doc, 'Income recognition details are available for Self-Employed and Salaried income types.', y)
  }
}

// ── Method comparison card ───────────────────────────────────────────────────

function drawMethodCard(doc, letter, title, x, y, w, { active, desc, rows, result }) {
  const H = 64
  const bg = active ? C.goldLight : C.surface
  doc.setFillColor(...bg)
  doc.roundedRect(x, y, w, H, 1.5, 1.5, 'F')

  if (active) {
    doc.setFillColor(...C.gold)
    doc.rect(x, y, w, 2, 'F')
  }

  setBold(doc, 7)
  doc.setTextColor(...(active ? C.navy : C.slate))
  doc.text(`Method ${letter} — ${title}`, x + 4, y + 8)

  if (active) {
    doc.setFillColor(...C.gold)
    doc.roundedRect(x + w - 22, y + 3.5, 18, 5, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...C.white)
    doc.text('APPLIED', x + w - 22 + 9, y + 7.2, { align: 'center' })
  }

  setBody(doc, 7)
  doc.setTextColor(...C.slate)
  const descLines = doc.splitTextToSize(desc, w - 8)
  doc.text(descLines.slice(0, 2), x + 4, y + 15)

  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.15)
  doc.line(x + 4, y + 24, x + w - 4, y + 24)

  let ry = y + 30
  rows.forEach(([lbl, val]) => {
    setBody(doc, 7)
    doc.setTextColor(...C.slate)
    doc.text(lbl, x + 4, ry)
    setBold(doc, 7.5)
    doc.setTextColor(...C.navy)
    doc.text(String(val), x + w - 4, ry, { align: 'right' })
    ry += 6.5
  })

  if (result != null) {
    setLabel(doc, 6.5)
    doc.setTextColor(...(active ? C.gold : C.muted))
    doc.text('RESULT', x + 4, y + H - 5)
    setBold(doc, 9)
    doc.setTextColor(...(active ? C.navy : C.slate))
    doc.text(czk(result) + '/mo', x + w - 4, y + H - 5, { align: 'right' })
  }
}

function drawDataRow(doc, lbl, val, x, y) {
  setLabel(doc, 6.5)
  doc.setTextColor(...C.muted)
  doc.text(lbl.toUpperCase(), x, y)
  setBold(doc, 9)
  doc.setTextColor(...C.navy)
  doc.text(String(val ?? '—'), x, y + 5.5)
}
