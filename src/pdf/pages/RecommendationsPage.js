import {
  C, PAGE, pageHeader, pageFooter, sectionHeader, hRule,
  bodyText, setBold, setBody, setLabel, setDisplay, calloutBox,
} from '../styles.js'
import { buildRecommendations } from '../narrative.js'

const IMPACT_STYLE = {
  CRITICAL: { bg: C.riskBg,    tx: C.riskTx,    ac: C.riskAc,    tag: '● CRITICAL' },
  HIGH:     { bg: C.warningBg, tx: C.warningTx,  ac: C.warningAc, tag: '▲ HIGH IMPACT' },
  MEDIUM:   { bg: C.brandLight,tx: C.brand,       ac: C.brand,     tag: '◆ MEDIUM' },
  LOW:      { bg: C.surface,   tx: C.slate,       ac: C.muted,     tag: '○ LOW' },
  ACTION:   { bg: C.navy,      tx: C.white,       ac: C.gold,      tag: '★ ACTION' },
}

export function drawRecommendationsPage(doc, ctx) {
  const { formData, profile, score, pageNum, totalPages } = ctx

  pageHeader(doc, 'Recommendations', pageNum, totalPages)
  pageFooter(doc)

  let y = 20
  const M = PAGE.M
  const CW = PAGE.CW

  y = sectionHeader(doc, 'Priority Recommendations',
    'Ranked by impact on mortgage capacity — highest return actions listed first', y)

  const recs = buildRecommendations(formData, profile, score)

  // Group by priority for visual flow
  const ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'ACTION']

  ORDER.forEach((impact) => {
    const group = recs.filter(r => r.impact === impact)
    if (group.length === 0) return

    group.forEach(({ label, text }, i) => {
      if (y > 255) {
        doc.addPage()
        pageHeader(doc, 'Recommendations (cont.)', pageNum, totalPages)
        pageFooter(doc)
        y = 20
      }

      const style = IMPACT_STYLE[impact]
      const textLines = doc.splitTextToSize(text, CW - 20)
      const cardH = textLines.length * 5 + 20

      // Card background
      doc.setFillColor(...style.bg)
      doc.roundedRect(M, y, CW, cardH, 2, 2, 'F')

      // Left accent strip
      doc.setFillColor(...style.ac)
      doc.rect(M, y, 3, cardH, 'F')

      // Priority tag
      setLabel(doc, 6.5)
      doc.setTextColor(...style.ac)
      doc.text(style.tag, M + 8, y + 6.5)

      // Title
      setBold(doc, 9.5)
      doc.setTextColor(...(impact === 'ACTION' ? C.white : C.navy))
      doc.text(label, M + 8, y + 12.5)

      // Body text
      setBody(doc, 8.5)
      doc.setTextColor(...(impact === 'ACTION' ? C.muted : style.tx))
      doc.text(textLines, M + 8, y + 18)

      y += cardH + 4
    })
  })

  // If we have very few recs, add a note
  if (recs.filter(r => r.impact !== 'ACTION').length <= 2) {
    y += 4
    y = calloutBox(doc,
      'This profile has very few active optimisation opportunities — it is already well-positioned for standard bank submission. The recommended next step is booking a strategy session to identify the specific lender offering the best rate for this profile.',
      y,
      { bg: C.successBg, tx: C.successTx, icon: '✓' },
    )
  }
}
