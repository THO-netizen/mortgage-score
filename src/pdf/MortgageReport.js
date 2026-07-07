// ── Premium PDF Report Orchestrator ────────────────────────────────────────
// Assembles all page modules into a single jsPDF document.

import { jsPDF } from 'jspdf'
import { computeScore, computeMortgageProfile } from '../utils/scoringEngine.js'
import { drawCoverPage }              from './pages/CoverPage.js'
import { drawExecutiveSummaryPage }   from './pages/ExecutiveSummaryPage.js'
import { drawApplicantSnapshotPage }  from './pages/ApplicantSnapshotPage.js'
import { drawConstraintAnalysisPage } from './pages/ConstraintAnalysisPage.js'
import { drawIncomeRecognitionPage }  from './pages/IncomeRecognitionPage.js'
import { drawReadinessScorePage }     from './pages/ReadinessScorePage.js'
import { drawRecommendationsPage }    from './pages/RecommendationsPage.js'
import { drawScenarioComparisonPage } from './pages/ScenarioComparisonPage.js'
import { drawExpertCommentaryPage }   from './pages/ExpertCommentaryPage.js'
import { drawFinalSummaryPage }       from './pages/FinalSummaryPage.js'

// Page registry — each entry describes one page section
const PAGE_SECTIONS = [
  { key: 'cover',        label: 'Cover',               draw: drawCoverPage,              header: false },
  { key: 'executive',    label: 'Executive Summary',    draw: drawExecutiveSummaryPage,   header: true  },
  { key: 'snapshot',     label: 'Applicant Snapshot',   draw: drawApplicantSnapshotPage,  header: true  },
  { key: 'constraints',  label: 'Constraint Analysis',  draw: drawConstraintAnalysisPage, header: true  },
  { key: 'income',       label: 'Income Recognition',   draw: drawIncomeRecognitionPage,  header: true  },
  { key: 'readiness',    label: 'Readiness Score',      draw: drawReadinessScorePage,     header: true  },
  { key: 'recs',         label: 'Recommendations',      draw: drawRecommendationsPage,    header: true  },
  { key: 'scenarios',    label: 'Scenario Comparison',  draw: drawScenarioComparisonPage, header: true  },
  { key: 'commentary',   label: 'Expert Commentary',    draw: drawExpertCommentaryPage,   header: true  },
  { key: 'summary',      label: 'Final Summary',        draw: drawFinalSummaryPage,       header: true  },
]

/**
 * Generate the premium mortgage assessment PDF.
 *
 * @param {object} formData  — full user input object from the funnel
 * @param {string} userName  — display name (falls back to formData.leadName)
 * @returns {Blob}           — PDF blob (caller triggers download)
 */
export function generatePremiumReport(formData, userName) {
  // ── Resolve income for profile computation ──────────────
  const resolvedIncome =
    (formData.netMonthlySalary > 0 ? formData.netMonthlySalary : formData.netIncome) ?? 0

  const mergedFormData = { ...formData, netIncome: resolvedIncome, leadName: userName || formData.leadName }

  // ── Compute score and full profile ──────────────────────
  const score   = computeScore(mergedFormData)
  const profile = computeMortgageProfile(mergedFormData)

  // ── Build shared context object ──────────────────────────
  const today = new Date().toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const totalPages = PAGE_SECTIONS.length

  const ctx = {
    formData: mergedFormData,
    profile,
    score,
    today,
    totalPages,
    pageNum: 1,   // updated per page
  }

  // ── Create document ──────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ── Draw each section ────────────────────────────────────
  PAGE_SECTIONS.forEach(({ draw }, i) => {
    if (i > 0) doc.addPage()
    ctx.pageNum = i + 1
    draw(doc, ctx)
  })

  return doc.output('blob')
}
