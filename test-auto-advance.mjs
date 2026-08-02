/**
 * Auto-advance behaviour tests.
 * Run: node test-auto-advance.mjs
 *
 * Verifies the questionnaire flow classification:
 * - Single-choice screens auto-advance
 * - Numeric/multi-field screens retain confirmation buttons
 * - Double-tap protection
 * - Back navigation doesn't re-trigger auto-advance
 * - Calculation regression unchanged
 */

import { computeScore, computeMortgageProfile } from './src/utils/scoringEngine.js'
import { recommendVideos } from './src/utils/videoRecommender.js'
import { readFileSync } from 'fs'

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  ✓ ${message}`)
  } else {
    failed++
    console.error(`  ✗ ${message}`)
  }
}

function test(name, fn) {
  console.log(`\n${name}:`)
  fn()
}

// ── Helper: check if a file contains ActionBar in its footer ──
function fileContainsActionBar(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  return content.includes('ActionBar') || content.includes('<ActionBar')
}

function fileContainsAutoAdvance(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  return content.includes('advancingRef') || content.includes('setTimeout')
}

function fileContainsDoubleGuard(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  return content.includes('advancingRef.current') && content.includes('if (advancingRef.current) return')
}

// =============================================================================
// T1: Single-choice screens auto-advance (no Continue button)
// =============================================================================
test('T1: Single-choice screens have auto-advance, no ActionBar footer', () => {
  const entitySelect = readFileSync('./src/components/steps/step1/EntitySelect.jsx', 'utf-8')
  assert(!entitySelect.includes('footer={'), 'EntitySelect has no footer prop (no Continue button)')
  assert(entitySelect.includes('advancingRef'), 'EntitySelect has auto-advance ref')
  assert(entitySelect.includes('setTimeout'), 'EntitySelect uses delayed advance')

  const applicantCount = readFileSync('./src/components/steps/step1/ApplicantCount.jsx', 'utf-8')
  assert(!applicantCount.includes('footer={<ActionBar'), 'ApplicantCount has no ActionBar footer')
  assert(applicantCount.includes('advancingRef'), 'ApplicantCount has auto-advance ref')
})

// =============================================================================
// T2: Numeric/multi-field screens retain Continue buttons
// =============================================================================
test('T2: Input screens retain confirmation buttons', () => {
  assert(fileContainsActionBar('./src/components/steps/step1/EmployeeDetails.jsx'), 'EmployeeDetails has ActionBar')
  assert(fileContainsActionBar('./src/components/steps/step1/BusinessIncome.jsx'), 'BusinessIncome has ActionBar')
  assert(fileContainsActionBar('./src/components/steps/step1/SroIncome.jsx'), 'SroIncome has ActionBar')
  assert(fileContainsActionBar('./src/components/steps/step1/IcoVerify.jsx'), 'IcoVerify has ActionBar')
  assert(fileContainsActionBar('./src/components/steps/Step2Residence.jsx'), 'Step2Residence has ActionBar')
  assert(fileContainsActionBar('./src/components/steps/Step3Liabilities.jsx'), 'Step3Liabilities has ActionBar')
  assert(fileContainsActionBar('./src/components/steps/Step4Property.jsx'), 'Step4Property has ActionBar')
})

// =============================================================================
// T3: Context-specific button labels
// =============================================================================
test('T3: Context-specific button labels used', () => {
  const emp = readFileSync('./src/components/steps/step1/EmployeeDetails.jsx', 'utf-8')
  assert(emp.includes('continueLabel="Confirm income"'), 'EmployeeDetails uses "Confirm income"')

  const biz = readFileSync('./src/components/steps/step1/BusinessIncome.jsx', 'utf-8')
  assert(biz.includes('continueLabel="Confirm income"'), 'BusinessIncome uses "Confirm income"')

  const sro = readFileSync('./src/components/steps/step1/SroIncome.jsx', 'utf-8')
  assert(sro.includes('continueLabel="Confirm income"'), 'SroIncome uses "Confirm income"')

  const res = readFileSync('./src/components/steps/Step2Residence.jsx', 'utf-8')
  assert(res.includes('continueLabel="Confirm residence"'), 'Step2Residence uses "Confirm residence"')

  const liab = readFileSync('./src/components/steps/Step3Liabilities.jsx', 'utf-8')
  assert(liab.includes('continueLabel="Save obligations"'), 'Step3Liabilities uses "Save obligations"')

  const prop = readFileSync('./src/components/steps/Step4Property.jsx', 'utf-8')
  assert(prop.includes('continueLabel="Prepare my assessment"'), 'Step4Property uses "Prepare my assessment"')

  const gate = readFileSync('./src/components/funnel/LeadGate.jsx', 'utf-8')
  assert(gate.includes('Reveal my assessment'), 'LeadGate uses "Reveal my assessment"')
})

// =============================================================================
// T4: Double-click protection
// =============================================================================
test('T4: Double-click/double-tap protection', () => {
  assert(fileContainsDoubleGuard('./src/components/steps/step1/EntitySelect.jsx'), 'EntitySelect has double-tap guard')
  assert(fileContainsDoubleGuard('./src/components/steps/step1/ApplicantCount.jsx'), 'ApplicantCount has double-tap guard')

  const prop = readFileSync('./src/components/steps/Step4Property.jsx', 'utf-8')
  assert(prop.includes('advancingRef.current') && prop.includes('if (advancingRef.current) return'), 'Step4Property discovering mode has double-tap guard')
})

// =============================================================================
// T5: Back navigation support
// =============================================================================
test('T5: Back navigation available on auto-advance screens', () => {
  const applicantCount = readFileSync('./src/components/steps/step1/ApplicantCount.jsx', 'utf-8')
  assert(applicantCount.includes('onBack') && applicantCount.includes('onClick={onBack}'), 'ApplicantCount has Back button')

  const index = readFileSync('./src/components/steps/step1/index.jsx', 'utf-8')
  assert(index.includes('goBack'), 'Step1 index has goBack function')
})

// =============================================================================
// T6: Screen reader announcements
// =============================================================================
test('T6: Screen reader announcements for step transitions', () => {
  const index = readFileSync('./src/components/steps/step1/index.jsx', 'utf-8')
  assert(index.includes('aria-live="assertive"'), 'Has assertive aria-live announcer')
  assert(index.includes('announce('), 'Uses announce function for transitions')
  assert(index.includes("announce('Next question')"), 'Announces next question on forward')
  assert(index.includes("announce('Previous question')"), 'Announces previous question on back')
})

// =============================================================================
// T7: Reduced motion support
// =============================================================================
test('T7: Reduced motion respected', () => {
  const index = readFileSync('./src/components/steps/step1/index.jsx', 'utf-8')
  assert(index.includes('prefers-reduced-motion'), 'Checks prefers-reduced-motion media query')
  assert(index.includes("'instant'"), 'Uses instant scroll when motion reduced')
})

// =============================================================================
// T8: Keyboard activation advances (Enter/Space)
// =============================================================================
test('T8: Keyboard selection triggers advance', () => {
  const entity = readFileSync('./src/components/steps/step1/EntitySelect.jsx', 'utf-8')
  assert(entity.includes("e.key === 'Enter'"), 'EntitySelect handles Enter key')
  assert(entity.includes("e.key === ' '"), 'EntitySelect handles Space key')
  assert(entity.includes('onKeyDown'), 'EntitySelect has onKeyDown handler')

  const count = readFileSync('./src/components/steps/step1/ApplicantCount.jsx', 'utf-8')
  assert(count.includes("e.key === 'Enter'"), 'ApplicantCount handles Enter key')
  assert(count.includes("e.key === ' '"), 'ApplicantCount handles Space key')
})

// =============================================================================
// T9: Keyboard focus alone does not advance
// =============================================================================
test('T9: Focus alone does not trigger advance', () => {
  const entity = readFileSync('./src/components/steps/step1/EntitySelect.jsx', 'utf-8')
  assert(!entity.includes('onFocus') || !entity.includes('handleSelect'), 'EntitySelect does not advance on focus')

  const count = readFileSync('./src/components/steps/step1/ApplicantCount.jsx', 'utf-8')
  assert(!count.includes('onFocus') || !count.includes('handleSelect'), 'ApplicantCount does not advance on focus')
})

// =============================================================================
// T10: Step4 "exploring" mode auto-advances
// =============================================================================
test('T10: Step4 "exploring" mode auto-advances with delay', () => {
  const prop = readFileSync('./src/components/steps/Step4Property.jsx', 'utf-8')
  assert(prop.includes("mode === 'discovering'") && prop.includes('setTimeout'), 'Discovering mode auto-advances with timeout')
  assert(prop.includes('280'), 'Uses ~280ms delay for perceivable transition')
})

// =============================================================================
// T11: Mortgage calculation regression
// =============================================================================
test('T11: Mortgage calculation regression unchanged', () => {
  const formData = {
    entityType: 'zamestnanec',
    numberOfApplicants: 1,
    applicantAge: 35,
    netMonthlySalary: 120000,
    netIncome: 120000,
    contractType: 'indefinite',
    isProbation: false,
    residenceStatus: 'eu',
    yearsInCZ: '10plus',
    monthlyLoanPayments: 0,
    creditCardLimits: 0,
    monthlyLeasing: 0,
    otherObligations: 0,
    propertyMode: 'defined',
    purchasePrice: 8000000,
    ownFunds: 2500000,
    propertyPurpose: 'primary',
    purchaseTimeline: '3months',
  }

  const score = computeScore(formData)
  const profile = computeMortgageProfile({ ...formData })

  assert(score >= 70, `High earner score ≥ 70: ${score}`)
  assert(profile.riskStatus === 'zelena', `Risk is green: ${profile.riskStatus}`)
  assert(profile.eX > 0, `Borrowing capacity positive: ${profile.eX}`)
})

// =============================================================================
// T12: Video recommendations unchanged
// =============================================================================
test('T12: Video recommendations still deterministic', () => {
  const formData = {
    entityType: 'zamestnanec',
    numberOfApplicants: 1,
    applicantAge: 28,
    netMonthlySalary: 45000,
    netIncome: 45000,
    contractType: 'indefinite',
    isProbation: false,
    residenceStatus: 'longterm',
    yearsInCZ: '2-5',
    monthlyLoanPayments: 0,
    creditCardLimits: 0,
    monthlyLeasing: 0,
    otherObligations: 0,
    propertyMode: 'discovering',
    purchasePrice: 0,
    ownFunds: 0,
    propertyPurpose: 'primary',
    purchaseTimeline: 'exploring',
  }

  const score = computeScore(formData)
  const profile = computeMortgageProfile({ ...formData })
  const rec1 = recommendVideos(formData, profile, score)
  const rec2 = recommendVideos(formData, profile, score)

  assert(rec1.primary.video.id === rec2.primary.video.id, `Primary video deterministic: ${rec1.primary.video.id}`)
  assert(rec1.secondary.length === rec2.secondary.length, `Secondary count stable: ${rec1.secondary.length}`)
})

// =============================================================================
// T13: Lead gate still requires submission
// =============================================================================
test('T13: Lead gate still requires submission before results', () => {
  const gate = readFileSync('./src/components/funnel/LeadGate.jsx', 'utf-8')
  assert(gate.includes('handleSubmit'), 'LeadGate has submit handler')
  assert(gate.includes('onUnlock'), 'LeadGate gates results via onUnlock callback')
  assert(!gate.includes('advancingRef'), 'LeadGate does NOT auto-advance (requires explicit submit)')

  const app = readFileSync('./src/App.jsx', 'utf-8')
  assert(app.includes('STEP_LEAD_GATE') && app.includes('STEP_RESULTS'), 'App routes through lead gate before results')
})

// =============================================================================
// T14: Homepage trust line removed
// =============================================================================
test('T14: Homepage "4 minutes · No documents · Private" line removed', () => {
  const hero = readFileSync('./src/components/landing/HeroAnalysis.jsx', 'utf-8')
  assert(!hero.includes('4 minutes'), '"4 minutes" text removed from hero')
  assert(!hero.includes('No documents'), '"No documents" text removed from hero')
  assert(hero.includes('Begin Private Assessment'), 'CTA button still present')
})

// =============================================================================
// Summary
// =============================================================================
console.log(`\n${'='.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
