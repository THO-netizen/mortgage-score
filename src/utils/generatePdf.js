// ── PDF generation entry point ──────────────────────────────────────────────
// Delegates to the premium modular engine in src/pdf/.
// Legacy alias kept for backwards compatibility with existing call sites.

export { generatePremiumReport as generateMortgagePdf } from '../pdf/MortgageReport.js'
