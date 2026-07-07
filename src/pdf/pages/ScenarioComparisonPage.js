import {
  C, PAGE, pageHeader, pageFooter, sectionHeader, hRule, bodyText,
  setBold, setBody, setLabel, czk, czkShort, pct,
} from '../styles.js'
import { buildScenarios } from '../narrative.js'
import { computeMortgageProfile } from '../../utils/scoringEngine.js'

export function drawScenarioComparisonPage(doc, ctx) {
  const { formData, profile, pageNum, totalPages } = ctx
  const { eX, bottleneck } = profile

  pageHeader(doc, 'Scenario Comparison', pageNum, totalPages)
  pageFooter(doc)

  let y = 20
  const M = PAGE.M
  const CW = PAGE.CW

  y = sectionHeader(doc, 'Scenario Comparison',
    'Sensitivity analysis — how income, debt, and own-funds changes affect maximum loan', y)

  // ── Scenario table ────────────────────────────────────
  setLabel(doc, 7)
  doc.setTextColor(...C.gold)
  doc.text('CAPACITY SENSITIVITY — KEY SCENARIOS', M, y)
  y += 7

  const scenarios = buildScenarios(formData, profile)

  // Compute E[X] for each scenario
  const scenarioResults = scenarios.map((s) => {
    try {
      const fd = { ...formData, netIncome: s.income, existingDebt: s.debt }
      const p  = computeMortgageProfile(fd)
      return { ...s, eX: p.eX ?? 0, eXStress: p.eXStress ?? 0 }
    } catch {
      return { ...s, eX: 0, eXStress: 0 }
    }
  })

  // Base for delta calculation
  const baseEX = scenarioResults[0]?.eX ?? eX ?? 0

  // Header row
  doc.setFillColor(...C.navy)
  doc.rect(M, y - 4.5, CW, 7.5, 'F')
  const COLS = [46, 36, 36, 30, 22]  // label | income | debt | maxLoan | delta
  setBold(doc, 7.5)
  doc.setTextColor(...C.white)
  let hx = M
  ;['Scenario', 'Income/mo', 'Debt/mo', 'Max Loan', 'Δ vs Base'].forEach((h, i) => {
    doc.text(h, i === 0 ? hx : hx + COLS[i], y, { align: i === 0 ? 'left' : 'right' })
    hx += COLS[i] + 2
  })
  y += 7.5

  scenarioResults.forEach(({ label, income, debt, eX: scenEX, eXStress: scenStress }, i) => {
    const isBase  = i === 0
    const delta   = scenEX - baseEX
    const deltaSign = delta >= 0 ? '+' : ''
    const bg = isBase ? C.goldLight : i % 2 === 0 ? C.surface : C.white

    doc.setFillColor(...bg)
    doc.rect(M, y - 4.5, CW, 7.5, 'F')

    let cx = M
    const vals = [
      { v: label,           align: 'left',  bold: true,  color: C.navy   },
      { v: czk(income),     align: 'right', bold: false, color: C.slate  },
      { v: czk(debt),       align: 'right', bold: false, color: C.slate  },
      { v: czkShort(scenEX),align: 'right', bold: isBase,color: C.navy   },
      { v: delta !== 0 ? `${deltaSign}${czkShort(Math.abs(delta))}` : '—',
        align: 'right', bold: delta > 0, color: delta > 0 ? C.successTx : delta < 0 ? C.riskTx : C.muted },
    ]

    vals.forEach(({ v, align, bold, color }, ci) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...color)
      doc.text(String(v), align === 'right' ? cx + COLS[ci] : cx, y, { align })
      cx += COLS[ci] + 2
    })

    if (isBase) {
      setBold(doc, 6.5)
      doc.setTextColor(...C.gold)
      doc.text('BASE', M + CW - 2, y - 4, { align: 'right' })
    }

    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.1)
    doc.line(M, y + 3, M + CW, y + 3)
    y += 7.5
  })

  y += 6
  y = hRule(doc, y)

  // ── Stress-test column note ───────────────────────────
  setLabel(doc, 7)
  doc.setTextColor(...C.gold)
  doc.text('HOW SCENARIOS ARE CALCULATED', M, y)
  y += 6

  const note = 'Each scenario applies the same Czech bank dual-test methodology (DSTI at 4.89% / DI at 6.89%) to the modified input, taking the minimum of the two test results as the binding maximum loan. Changes to income directly expand DSTI headroom; changes to debt reduce the monthly obligation load that competes with the mortgage payment; changes to own funds shift the LTV position and may unlock higher loan caps.'
  y = bodyText(doc, note, y, { size: 8.5, lineH: 5 })

  y += 4

  // ── Per-bank summary for base profile ─────────────────
  if (profile.bankResults) {
    y = hRule(doc, y)
    setLabel(doc, 7)
    doc.setTextColor(...C.gold)
    doc.text('BASE PROFILE — PER-BANK CAPACITY SUMMARY', M, y)
    y += 7

    const BANK_NAMES = {
      mbank: 'mBank', kb: 'KB', csob: 'CSOB',
      cs: 'Ceska sporitelna', rb: 'Raiffeisenbank', ucb: 'UniCredit',
    }
    const BKEYS = ['mbank', 'kb', 'csob', 'cs', 'rb', 'ucb']
    const BC = [38, 26, 26, 26, 28, 22]

    // Header
    doc.setFillColor(...C.navyMid)
    doc.rect(M, y - 4.5, CW, 7.5, 'F')
    setBold(doc, 7.5)
    doc.setTextColor(...C.white)
    let bhx = M
    ;['Bank', 'DSTI Limit', 'Max(DSTI)', 'Max(DI)', 'Best Offer', 'Winner'].forEach((h, i) => {
      doc.text(h, i === 0 ? bhx : bhx + BC[i], y, { align: i === 0 ? 'left' : 'right' })
      bhx += BC[i] + 2
    })
    y += 7.5

    BKEYS.forEach((key, idx) => {
      const r = profile.bankResults[key]
      if (!r) return
      const isW = key === profile.winnerBank
      doc.setFillColor(...(isW ? C.goldLight : idx % 2 === 0 ? C.surface : C.white))
      doc.rect(M, y - 4.5, CW, 7.5, 'F')

      let bcx = M
      const bcols = [
        BANK_NAMES[key] ?? key,
        r.effectiveDSTI > 0 ? pct(r.effectiveDSTI * 100) : '—',
        r.maxByDSTI > 0     ? czkShort(r.maxByDSTI) : '—',
        r.maxByDI > 0       ? czkShort(r.maxByDI)   : '—',
        r.maxLoan > 0       ? czkShort(r.maxLoan)   : '—',
        isW                 ? '★'                   : '',
      ]
      bcols.forEach((val, ci) => {
        const isStar = ci === 5 && isW
        doc.setFont('helvetica', (isW || ci === 0) ? 'bold' : 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...(isStar ? C.gold : isW ? C.navy : ci === 0 ? C.slate : C.ink))
        doc.text(String(val), ci === 0 ? bcx : bcx + BC[ci], y, { align: ci === 0 ? 'left' : 'right' })
        bcx += BC[ci] + 2
      })

      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.1)
      doc.line(M, y + 3, M + CW, y + 3)
      y += 7.5
    })
  }
}
