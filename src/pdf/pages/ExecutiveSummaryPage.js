import {
  C, PAGE, pageHeader, pageFooter, sectionHeader, bodyText, hRule,
  heroMetric, calloutBox, scoreColor, scoreLabel, czk, czkShort, pct,
} from '../styles.js'
import { buildExecutiveSummary } from '../narrative.js'

export function drawExecutiveSummaryPage(doc, ctx) {
  const { formData, profile, score, pageNum, totalPages } = ctx
  const { eX, eXStress, dstiAtEX, dtiRatio, effectiveIncome, bottleneck } = profile

  pageHeader(doc, 'Executive Summary', pageNum, totalPages)
  pageFooter(doc)

  let y = 20

  y = sectionHeader(doc, 'Executive Summary', 'Assessment overview and capacity at a glance', y)

  // ── Three hero metrics ────────────────────────────────
  const metW = (PAGE.CW - 4) / 3
  const M = PAGE.M

  heroMetric(doc, 'Readiness Score', `${score} / 100`, scoreLabel(score), M, y, metW)
  heroMetric(doc, 'Max Loan (E[X])', czkShort(eX), 'At contract rate (4.89% p.a.)', M + metW + 2, y, metW)
  heroMetric(doc, 'Stress-Tested Max', czkShort(eXStress), 'At stressed rate (5.89% p.a.)', M + (metW + 2) * 2, y, metW)
  y += 36

  // ── Secondary metrics row ─────────────────────────────
  const sm = (PAGE.CW - 6) / 4
  const smH = 18

  const smDefs = [
    { lbl: 'DSTI at Max Loan',  val: pct(dstiAtEX),              sub: 'Limit: 45%'    },
    { lbl: 'DTI Multiple',      val: dtiRatio > 0 ? `${dtiRatio.toFixed(1)}×` : '—',  sub: 'Limit: 9.5×'   },
    { lbl: 'Recognised Income', val: czk(effectiveIncome),       sub: 'Per month, net' },
    { lbl: 'Binding Constraint',val: bottleneck ?? 'DSTI',       sub: 'Primary limiter'},
  ]

  smDefs.forEach(({ lbl, val, sub }, i) => {
    const x = M + i * (sm + 2)
    doc.setFillColor(...C.surface)
    doc.roundedRect(x, y, sm, smH, 1, 1, 'F')
    // Top gold accent
    doc.setFillColor(...C.gold)
    doc.rect(x, y, sm, 1.5, 'F')
    import_label(doc, lbl, x + 3, y + 6.5)
    import_value(doc, val, x + 3, y + 13)
    if (sub) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...C.muted)
      doc.text(sub, x + 3, y + smH - 2)
    }
  })
  y += smH + 8

  y = hRule(doc, y)

  // ── Narrative paragraphs ──────────────────────────────
  const paras = buildExecutiveSummary(formData, profile, score)

  paras.forEach((para, i) => {
    if (i === 0) {
      // Lead paragraph: slightly larger
      doc.setFont('times', 'italic')
      doc.setFontSize(10.5)
      doc.setTextColor(...C.navy)
      const lines = doc.splitTextToSize(para, PAGE.CW)
      doc.text(lines, PAGE.M, y)
      y += lines.length * 6 + 4
    } else {
      y = bodyText(doc, para, y, { size: 9, lineH: 5.5 })
      y += 3
    }
  })

  // ── Callout: Feasibility ──────────────────────────────
  const loanAmt = Math.max(0, (formData.purchasePrice || 0) - (formData.ownFunds || 0))
  if (loanAmt > 0) {
    const feasible = eX >= loanAmt
    y = calloutBox(doc,
      feasible
        ? `Target loan of ${czkShort(loanAmt)} is within assessed capacity (${czkShort(eX)} maximum). Underwriting headroom: ${czkShort(eX - loanAmt)}.`
        : `Target loan of ${czkShort(loanAmt)} exceeds current assessed maximum by ${czkShort(loanAmt - eX)}. See Scenario Comparison for gap-closing options.`,
      y + 2,
      { bg: feasible ? C.successBg : C.warningBg, tx: feasible ? C.successTx : C.warningTx, icon: feasible ? '✓' : '!' },
    )
  }
}

function import_label(doc, text, x, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...C.muted)
  doc.text(text.toUpperCase(), x, y)
}

function import_value(doc, text, x, y) {
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C.navy)
  doc.text(String(text ?? '—'), x, y)
}
