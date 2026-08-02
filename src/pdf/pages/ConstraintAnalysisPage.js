import {
  C, PAGE, pageHeader, pageFooter, sectionHeader, hRule, progressBar,
  tableRow, bodyText, boldText, setBold, setBody, setLabel, setHeading, calloutBox,
  czk, czkShort, pct, BANK_KEYS, BANK_DISPLAY,
} from '../styles.js'
import {
  CONTRACT_RATE_PA, DUAL_STRESS_RATE_PA,
  LIVING_MIN_CZK, HOUSING_COSTS_CZK, RESERVE_KOEF, ZM_ADDITIONAL_ADULT_CZK,
  monthlyPayment,
} from '../../utils/scoringEngine.js'

export function drawConstraintAnalysisPage(doc, ctx) {
  const { formData, profile, pageNum, totalPages } = ctx
  const {
    eX, eXStress, eXBase, dstiAtEX, dtiRatio, ltvPct, maxLTVPct, maxDTIVal,
    effectiveIncome, existingDebt, bottleneck, bankResults, winnerBank, flags = [],
    livingCosts, reserve, householdExpenses, maturity,
  } = profile

  pageHeader(doc, 'Constraint Analysis', pageNum, totalPages)
  pageFooter(doc)

  let y = 20
  const M = PAGE.M
  const CW = PAGE.CW

  y = sectionHeader(doc, 'Constraint Analysis', 'DSTI · DI · DTI · LTV — where borrowing capacity is bounded', y)

  // ── How capacity was calculated ───────────────────────
  if (effectiveIncome > 0 && eX > 0) {
    setLabel(doc, 7)
    doc.setTextColor(...C.gold)
    doc.text('HOW YOUR CAPACITY WAS CALCULATED', M, y)
    y += 5

    setBody(doc, 8)
    doc.setTextColor(...C.slate)
    doc.text('Czech banks run two independent tests and apply the stricter result.', M, y)
    y += 7

    const winnerResult = bankResults?.[winnerBank]
    const dstiLimit = winnerResult?.effectiveDSTI != null ? winnerResult.effectiveDSTI * 100 : 45
    const maxForDSTI = winnerResult?.maxByDSTI ?? eXBase ?? eX
    const maxForDI = winnerResult?.maxByDI ?? eXStress ?? 0

    const adults = formData.numberOfApplicants ?? 1
    const zmTotal = LIVING_MIN_CZK + Math.max(0, adults - 1) * ZM_ADDITIONAL_ADULT_CZK
    const housingCosts = HOUSING_COSTS_CZK
    const safetyReserve = reserve || Math.round((zmTotal + housingCosts) * RESERVE_KOEF)
    const obligations = existingDebt || 0
    const disposable = Math.max(0, effectiveIncome - zmTotal - housingCosts - safetyReserve - obligations)
    const dstiShare = Math.round(effectiveIncome * dstiLimit / 100)

    // Test A
    setBold(doc, 8.5)
    doc.setTextColor(...C.navy)
    doc.text(`TEST A — Debt Service Ratio`, M, y)
    setBody(doc, 7.5)
    doc.setTextColor(...C.muted)
    doc.text(`at ${CONTRACT_RATE_PA}% contract rate`, M + CW, y, { align: 'right' })
    y += 5

    const row = (label, value, indent = 0) => {
      setBody(doc, 8)
      doc.setTextColor(...C.slate)
      doc.text(label, M + 4 + indent, y)
      setBold(doc, 8)
      doc.setTextColor(...C.ink)
      doc.text(value, M + CW, y, { align: 'right' })
      y += 4.5
    }

    row('Recognised income', czk(effectiveIncome))
    row(`Maximum share for loan payments (${dstiLimit.toFixed(0)}%)`, czk(dstiShare))
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.15)
    doc.line(M + 4, y - 1, M + CW, y - 1)
    y += 1
    row('→ Maximum loan', czk(Math.round(maxForDSTI)))
    y += 3

    // Test B
    setBold(doc, 8.5)
    doc.setTextColor(...C.navy)
    doc.text(`TEST B — Disposable Income`, M, y)
    setBody(doc, 7.5)
    doc.setTextColor(...C.muted)
    doc.text(`at ${DUAL_STRESS_RATE_PA}% stress rate`, M + CW, y, { align: 'right' })
    y += 5

    row('Recognised income', czk(effectiveIncome))
    row('− Minimum living costs', `− ${czk(zmTotal)}`, 4)
    row('− Housing costs', `− ${czk(housingCosts)}`, 4)
    row(`− Safety reserve (${(RESERVE_KOEF * 100).toFixed(0)}%)`, `− ${czk(safetyReserve)}`, 4)
    row('− Existing obligations', `− ${czk(obligations)}`, 4)

    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.line(M + 4, y - 1, M + CW, y - 1)
    y += 1.5

    row('= Disposable income', czk(disposable))
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.15)
    doc.line(M + 4, y - 1, M + CW, y - 1)
    y += 1
    row('→ Maximum loan', maxForDI > 0 ? czk(Math.round(maxForDI)) : '—')
    y += 4

    // Result
    doc.setFillColor(...C.surface)
    doc.roundedRect(M, y - 3, CW, 12, 1.5, 1.5, 'F')
    setBold(doc, 9)
    doc.setTextColor(...C.navy)
    doc.text('YOUR RESULT — the lower of the two', M + 4, y + 3)
    setDisplay(doc, 11)
    doc.text(czk(Math.round(Math.min(maxForDSTI, maxForDI > 0 ? maxForDI : Infinity))), M + CW - 4, y + 3, { align: 'right' })
    y += 12

    // Binding test label
    if (bottleneck === 'DI') {
      y += 2
      setBody(doc, 8)
      doc.setTextColor(...C.warningAc)
      doc.text('Binding test: Disposable income (Test B) — your income after living costs is the limiting factor.', M, y)
      y += 5
    } else if (bottleneck === 'DSTI') {
      y += 2
      setBody(doc, 8)
      doc.setTextColor(...C.successAc)
      doc.text('Binding test: Debt service ratio (Test A) — disposable income is not restrictive at your income level.', M, y)
      y += 5
    }

    y += 3
    // Explanatory text
    setBody(doc, 7.5)
    doc.setTextColor(...C.slate)
    const explanations = [
      'Disposable income is what physically remains from your income after essential living costs, a safety reserve and existing obligations. It is the amount actually available to service a mortgage.',
      `Why two tests? Test A caps the share of income going to debt. Test B checks the absolute amount left over. A ratio alone can approve a loan that leaves a lower-income applicant below the subsistence level, so banks apply both and take the stricter result.`,
      `Why a higher rate in Test B? Test B is applied at ${DUAL_STRESS_RATE_PA}% — one percentage point above the contract rate — to verify the payment remains affordable if rates rise at refixation.`,
    ]
    explanations.forEach(txt => {
      const lines = doc.splitTextToSize(txt, CW)
      doc.text(lines, M, y)
      y += lines.length * 4 + 2.5
    })

    y = hRule(doc, y)
  }

  // ── Progress gauges ───────────────────────────────────
  setLabel(doc, 7)
  doc.setTextColor(...C.gold)
  doc.text('REGULATORY UTILISATION', M, y)
  y += 7

  const gauges = [
    {
      label:     'DSTI — Debt Service / Income (Test A, contract rate 4.89%)',
      value:     dstiAtEX ?? 0,
      max:       45,
      unit:      '%',
      limitPct:  1,
      fill:      (dstiAtEX ?? 0) > 42 ? C.riskAc : (dstiAtEX ?? 0) > 35 ? C.warningAc : C.successAc,
    },
    {
      label:     'DTI — Total Debt / Annual Income',
      value:     dtiRatio > 0 ? dtiRatio : 0,
      max:       maxDTIVal ?? 9.5,
      unit:      '×',
      limitPct:  1,
      fill:      dtiRatio > (maxDTIVal ?? 9.5) * 0.9 ? C.riskAc : dtiRatio > (maxDTIVal ?? 9.5) * 0.7 ? C.warningAc : C.successAc,
    },
    {
      label:     `LTV — Loan-to-Value (max ${maxLTVPct}%)`,
      value:     ltvPct ?? 0,
      max:       maxLTVPct ?? 80,
      unit:      '%',
      limitPct:  1,
      fill:      (ltvPct ?? 0) > (maxLTVPct ?? 80) ? C.riskAc : (ltvPct ?? 0) > (maxLTVPct ?? 80) * 0.85 ? C.warningAc : C.successAc,
    },
  ]

  gauges.forEach(({ label, value, max, unit, limitPct, fill }) => {
    y = progressBar(doc, label, value, max, y, { unit, fillColor: fill, limitPct })
    y += 2
  })

  y = hRule(doc, y)

  // ── Per-bank dual test table ──────────────────────────
  setLabel(doc, 7)
  doc.setTextColor(...C.gold)
  doc.text('PER-BANK LOAN CAPACITY — DUAL TEST RESULTS', M, y)
  y += 7

  if (bankResults) {
    const COL = [38, 26, 26, 26, 30, 22]
    y = tableRow(doc,
      ['Bank', 'Max (DSTI)', 'Max (DI)', 'DSTI Limit', 'Max Loan', 'Winner'],
      y, COL, { bg: C.navy, bold: true, size: 7.5 },
    )
    doc.setFillColor(...C.navy)
    doc.rect(M, y - 7.5, CW, 7.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C.white)
    let hx = M
    ;['Bank', 'Max (DSTI)', 'Max (DI)', 'DSTI Limit', 'Max Loan', 'Winner'].forEach((h, i) => {
      doc.text(h, i === 0 ? hx : hx + COL[i], y - 2, { align: i === 0 ? 'left' : 'right' })
      hx += COL[i] + 2
    })

    BANK_KEYS.forEach((key, idx) => {
      const r = bankResults[key]
      if (!r) return
      const isWinner = key === winnerBank
      const bg = isWinner ? C.goldLight : idx % 2 === 0 ? C.surface : C.white

      doc.setFillColor(...bg)
      doc.rect(M, y - 4.5, CW, 7.5, 'F')

      const cols = [
        BANK_DISPLAY[key] ?? key,
        r.maxByDSTI > 0 ? czkShort(r.maxByDSTI) : '—',
        r.maxByDI   > 0 ? czkShort(r.maxByDI)   : '—',
        r.effectiveDSTI > 0 ? pct(r.effectiveDSTI * 100) : '—',
        r.maxLoan   > 0 ? czkShort(r.maxLoan)   : '—',
        isWinner ? '★ Best' : '',
      ]

      let cx = M
      cols.forEach((val, ci) => {
        const isRight = ci > 0
        doc.setFont('helvetica', isWinner ? 'bold' : ci === 0 ? 'bold' : 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...(isWinner ? C.navy : ci === 0 ? C.slate : C.ink))
        if (ci === 5 && isWinner) doc.setTextColor(...C.gold)
        doc.text(String(val), isRight ? cx + COL[ci] : cx, y, { align: isRight ? 'right' : 'left' })
        cx += COL[ci] + 2
      })

      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.1)
      doc.line(M, y + 3, M + CW, y + 3)

      y += 7.5
    })

    y += 4
  }

  y = hRule(doc, y)

  // ── Bottleneck explanation ─────────────────────────────
  setLabel(doc, 7)
  doc.setTextColor(...C.gold)
  doc.text('BINDING CONSTRAINT ANALYSIS', M, y)
  y += 7

  const bottleneckText = {
    DSTI: `The Debt Service-to-Income ratio (Test A) is the binding constraint. At ${pct(dstiAtEX)} utilisation against the 45% ceiling, available headroom is ${pct(45 - (dstiAtEX ?? 0))}. Disposable income is not restrictive at this income level. Reducing monthly obligations or increasing recognised income are the primary levers.`,
    DI:   `The Disposable Income test (Test B at ${DUAL_STRESS_RATE_PA}%) is the binding constraint — it produces a lower maximum (${czkShort(eXStress)}) than the DSTI test (${czkShort(eXBase ?? eX)}). Your income after essential living costs and the safety reserve is the limiting factor. Increasing income or reducing living-cost deductions (e.g. clearing existing obligations) are the most direct responses.`,
    DTI:  `The Debt-to-Income multiple (DTI) is the binding constraint — the total loan would exceed ${maxDTIVal}× annual income. This is a volume constraint rather than a monthly payment constraint. The only lever is increasing recognised annual income, which expands the DTI headroom directly.`,
    LTV:  `Loan-to-Value is the binding constraint. Income capacity supports a larger loan, but the purchase structure hits the ${maxLTVPct}% LTV ceiling. The remedy is increased own funds — each CZK 100,000 added to the deposit reduces LTV and can unlock additional loan capacity within income limits.`,
  }

  const btxt = bottleneckText[bottleneck] ?? `The primary constraint is ${bottleneck}. Review the scenario comparison section for targeted improvement options.`
  y = bodyText(doc, btxt, y, { size: 9, lineH: 5.2 })
}
