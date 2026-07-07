import {
  C, PAGE, pageHeader, pageFooter, sectionHeader, hRule, accentRule,
  bodyText, boldText, setBold, setBody, setLabel, setDisplay, setHeading,
  calloutBox, czk, czkShort, pct,
} from '../styles.js'
import { buildExpertCommentary } from '../narrative.js'

export function drawExpertCommentaryPage(doc, ctx) {
  const { formData, profile, score, pageNum, totalPages } = ctx
  const { eX, eXStress, effectiveIncome, bottleneck, maturity, flags = [], redFlags = [] } = profile
  const { applicantAge, purchasePrice, purchaseTimeline, entityType } = formData

  pageHeader(doc, 'Expert Commentary', pageNum, totalPages)
  pageFooter(doc)

  let y = 20
  const M = PAGE.M
  const CW = PAGE.CW

  y = sectionHeader(doc, 'Expert Commentary & Strategy',
    'Detailed interpretation of your profile and the optimal path forward', y)

  // ── Expert intro ──────────────────────────────────────
  setBody(doc, 8.5)
  doc.setTextColor(...C.slate)
  const intro = 'This commentary is generated from your specific assessment data and reflects the actual Czech bank underwriting methodology applied to your profile. Each section below interprets the numbers in terms of their practical impact on your borrowing capacity and application strategy.'
  const introLines = doc.splitTextToSize(intro, CW)
  doc.text(introLines, M, y)
  y += introLines.length * 5 + 6

  // ── Commentary paragraphs ─────────────────────────────
  const paras = buildExpertCommentary(formData, profile, score)

  const subheadings = [
    'Binding Constraint & Capacity Ceiling',
    'Age, Term, and Extension Eligibility',
    'Income Structure & Recognition',
    'Stress-Test Interpretation',
    'Cross-Bank Variance',
  ]

  paras.forEach((para, i) => {
    if (y > 255) {
      doc.addPage()
      pageHeader(doc, 'Expert Commentary (cont.)', pageNum, totalPages)
      pageFooter(doc)
      y = 20
    }

    // Sub-heading for first 2 paragraphs
    if (i < subheadings.length && i < 2) {
      setLabel(doc, 7)
      doc.setTextColor(...C.gold)
      doc.text(subheadings[i].toUpperCase(), M, y)
      y += 5.5
    }

    // Lead paragraph: slight serif emphasis
    if (i === 0) {
      doc.setFont('times', 'italic')
      doc.setFontSize(10)
      doc.setTextColor(...C.navy)
      const lines = doc.splitTextToSize(para, CW)
      doc.text(lines, M, y)
      y += lines.length * 6 + 5
    } else {
      y = bodyText(doc, para, y, { size: 9, lineH: 5.5 })
      y += 5
    }
  })

  y = hRule(doc, y)

  // ── Strategic pathway ─────────────────────────────────
  setLabel(doc, 7)
  doc.setTextColor(...C.gold)
  doc.text('RECOMMENDED STRATEGIC PATHWAY', M, y)
  y += 7

  const timeline = purchaseTimeline ?? 'exploring'
  const horizonMap = { '3months': 'immediately', '6months': 'within the next 6 months', '12months': 'over the next 6–12 months', exploring: 'as part of longer-term planning' }
  const horizonStr = horizonMap[timeline] ?? 'over the medium term'

  const pathway = score >= 75
    ? [
        { step: '1', title: 'Book Strategy Session',   text: `Your profile is submission-ready. The next step is a 45-minute session to identify the specific bank offering the best rate and terms — a decision worth thousands in total cost over the loan term.` },
        { step: '2', title: 'Prepare Document Package', text: 'Standard documents (payslips/tax returns, bank statements, property details) should be assembled in advance of the session to accelerate the pre-approval timeline.' },
        { step: '3', title: 'Submit Pre-Approval',      text: `With clean documentation and the right lender selected, a pre-approval can typically be issued within 2–3 weeks — positioning you strongly ${horizonStr}.` },
      ]
    : score >= 55
    ? [
        { step: '1', title: 'Resolve Priority Actions', text: 'Address the high-impact recommendations in the previous section — particularly any debt reduction or LTV improvement — before approaching lenders.' },
        { step: '2', title: 'Book Strategy Session',    text: 'A session will identify which lenders are best suited to your current profile and determine the precise timing for pre-approval submission.' },
        { step: '3', title: 'Monitor & Reapply',       text: 'If timing allows, implementing the 1–2 key improvements identified will materially improve the terms available. Your advisor will track these milestones.' },
      ]
    : [
        { step: '1', title: 'Resolve Hard Blocks',      text: 'Address all red-flag items before initiating any bank contact. Most Czech lenders will auto-decline applications with active red flags without reviewing income or property details.' },
        { step: '2', title: 'Capacity Building Phase',  text: `Use the ${redFlags.length > 0 ? '3–6 month' : '1–3 month'} preparation period to build business history, reduce debt, or restructure income. These are the highest-return actions available.` },
        { step: '3', title: 'Reassess & Submit',        text: 'Once the structural barriers are removed, a re-assessment will reflect the improved profile — at which point a strategy session and lender selection process can begin.' },
      ]

  pathway.forEach(({ step, title, text }) => {
    doc.setFillColor(...C.surface)
    const textLines = doc.splitTextToSize(text, CW - 20)
    const pH = textLines.length * 5 + 18
    doc.roundedRect(M, y, CW, pH, 1.5, 1.5, 'F')

    // Step circle
    doc.setFillColor(...C.navy)
    doc.circle(M + 8, y + 9, 5.5, 'F')
    setBold(doc, 9)
    doc.setTextColor(...C.white)
    doc.text(step, M + 8, y + 11.5, { align: 'center' })

    setBold(doc, 9.5)
    doc.setTextColor(...C.navy)
    doc.text(title, M + 18, y + 10)

    setBody(doc, 8.5)
    doc.setTextColor(...C.slate)
    doc.text(textLines, M + 18, y + 16)

    y += pH + 4
  })
}
