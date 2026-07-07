import {
  C, PAGE, pageHeader, pageFooter, sectionHeader, hRule, progressBar,
  tableRow, bodyText, setBold, setBody, setLabel, setHeading, calloutBox,
  czk, czkShort, pct, BANK_KEYS, BANK_DISPLAY,
} from '../styles.js'

export function drawConstraintAnalysisPage(doc, ctx) {
  const { formData, profile, pageNum, totalPages } = ctx
  const {
    eX, eXStress, dstiAtEX, dtiRatio, ltvPct, maxLTVPct, maxDTIVal,
    effectiveIncome, existingDebt, bottleneck, bankResults, winnerBank, flags = [],
  } = profile

  pageHeader(doc, 'Constraint Analysis', pageNum, totalPages)
  pageFooter(doc)

  let y = 20
  const M = PAGE.M
  const CW = PAGE.CW

  y = sectionHeader(doc, 'Constraint Analysis', 'DSTI · DI · DTI · LTV — where borrowing capacity is bounded', y)

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
      limitPct:  1,           // limit is 100% of 45
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
    // Header row
    const COL = [38, 26, 26, 26, 30, 22]  // widths summing to ~168
    y = tableRow(doc,
      ['Bank', 'Max (DSTI)', 'Max (DI)', 'DSTI Limit', 'Max Loan', 'Winner'],
      y, COL, { bg: C.navy, bold: true, size: 7.5 },
    )
    // Override colors for header text
    // (tableRow sets slate/ink — we re-set after for white header)
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
    DSTI: `The Debt Service-to-Income ratio (DSTI) is the binding constraint. At ${pct(dstiAtEX)} utilisation against the 45% ceiling, available headroom is ${pct(45 - (dstiAtEX ?? 0))}. This is driven by the combination of recognised income (${czk(effectiveIncome)}/mo) and existing obligations (${czk(existingDebt ?? 0)}/mo). Reducing monthly obligations or increasing recognised income are the primary levers.`,
    DI:   `The Stressed Income test (Test B at 6.89%) is the binding constraint — it produces a lower maximum than the DSTI test. This reflects Czech regulation requiring banks to use the more conservative of the two results. Increasing income or extending the loan term are the most direct responses.`,
    DTI:  `The Debt-to-Income multiple (DTI) is the binding constraint — the total loan would exceed ${maxDTIVal}× annual income. This is a volume constraint rather than a monthly payment constraint. The only lever is increasing recognised annual income, which expands the DTI headroom directly.`,
    LTV:  `Loan-to-Value is the binding constraint. Income capacity supports a larger loan, but the purchase structure hits the ${maxLTVPct}% LTV ceiling. The remedy is increased own funds — each CZK 100,000 added to the deposit reduces LTV and can unlock additional loan capacity within income limits.`,
  }

  const btxt = bottleneckText[bottleneck] ?? `The primary constraint is ${bottleneck}. Review the scenario comparison section for targeted improvement options.`
  y = bodyText(doc, btxt, y, { size: 9, lineH: 5.2 })

  // Stress vs Contract gap
  if (eX > 0 && eXStress > 0 && eXStress < eX) {
    const gap = eX - eXStress
    y += 3
    y = calloutBox(doc,
      `Stress-test gap: ${czkShort(gap)} reduction from contract-rate capacity (${czkShort(eX)}) to stressed capacity (${czkShort(eXStress)}). Czech banks use the lower of the two — the stressed figure is what your application is assessed against.`,
      y,
      { bg: C.surfaceAlt, tx: C.slate, icon: '△' },
    )
  }
}
