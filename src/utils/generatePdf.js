// Lazy-loads react-pdf only when the user triggers a download.
// Keeps the initial bundle lean; @react-pdf/renderer (~900kb) loads on demand.
export async function generateMortgagePdf(formData, userName) {
  const { generateReactPdf } = await import('../pdf/ReactPdfReport.jsx')
  return generateReactPdf(formData, userName)
}
