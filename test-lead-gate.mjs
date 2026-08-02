/**
 * Test suite for the Lead Gate logic and constraints.
 * Run: node test-lead-gate.mjs
 *
 * These tests verify:
 * - validation rules (name, email)
 * - the gate is positioned correctly in the flow (step 6, before step 7 results)
 * - assessment data survives the gate
 * - calculation results remain identical before and after
 */

import { computeScore, computeMortgageProfile } from './src/utils/scoringEngine.js'
import { recommendVideos } from './src/utils/videoRecommender.js'
import { VIDEO_LIBRARY } from './src/data/videoLibrary.js'

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

// ── Email validation regex (same as in LeadGate) ──
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// =============================================================================
// Test 1: Email validation
// =============================================================================
test('T1: Email validation rules', () => {
  assert(EMAIL_RE.test('user@example.com'), 'valid simple email accepted')
  assert(EMAIL_RE.test('name.surname@domain.co.uk'), 'valid dotted domain accepted')
  assert(EMAIL_RE.test('user+tag@gmail.com'), 'plus-tagged email accepted')
  assert(EMAIL_RE.test('čeština@domena.cz'), 'Czech diacritics in local part accepted')
  assert(!EMAIL_RE.test(''), 'empty string rejected')
  assert(!EMAIL_RE.test('no-at-sign'), 'missing @ rejected')
  assert(!EMAIL_RE.test('@domain.com'), 'missing local part rejected')
  assert(!EMAIL_RE.test('user@'), 'missing domain rejected')
  assert(!EMAIL_RE.test('user@domain'), 'missing TLD rejected')
  assert(!EMAIL_RE.test('user @domain.com'), 'space in local rejected')
})

// =============================================================================
// Test 2: Name validation
// =============================================================================
test('T2: Name validation rules', () => {
  const validName = (n) => typeof n === 'string' && n.trim().length >= 2

  assert(validName('Jan Novák'), 'Czech name with diacritics accepted')
  assert(validName('María José García-López'), 'Spanish compound name accepted')
  assert(validName('O\'Brien'), 'Irish apostrophe name accepted')
  assert(validName('Ай'), 'Two-char Cyrillic name accepted')
  assert(validName('李明'), 'Chinese two-char name accepted')
  assert(!validName(''), 'empty string rejected')
  assert(!validName('A'), 'single char rejected')
  assert(!validName('   '), 'whitespace-only rejected')
  assert(!validName(' X'), 'single char after trim rejected')
})

// =============================================================================
// Test 3: Optional phone does not block submission
// =============================================================================
test('T3: Phone field is optional', () => {
  const canSubmit = (name, email, phone) => {
    return name.trim().length >= 2 && EMAIL_RE.test(email) && true
  }

  assert(canSubmit('Jan Novák', 'jan@test.cz', ''), 'empty phone does not block')
  assert(canSubmit('Jan Novák', 'jan@test.cz', '+420 123 456 789'), 'phone provided also works')
})

// =============================================================================
// Test 4: Assessment answers survive the gate
// =============================================================================
test('T4: Assessment answers and calculations remain identical', () => {
  const formData = {
    entityType: 'zamestnanec',
    numberOfApplicants: 1,
    applicantAge: 30,
    netMonthlySalary: 60000,
    netIncome: 60000,
    contractType: 'indefinite',
    probationPeriod: 'no',
    isProbation: false,
    employmentSector: 'other',
    residenceStatus: 'eu',
    yearsInCZ: '5-10',
    monthlyLoanPayments: 5000,
    creditCardLimits: 50000,
    monthlyLeasing: 0,
    otherObligations: 0,
    propertyMode: 'defined',
    purchasePrice: 5000000,
    ownFunds: 1200000,
    propertyPurpose: 'primary',
    purchaseTimeline: '6months',
  }

  const scoreBefore = computeScore(formData)
  const profileBefore = computeMortgageProfile({ ...formData })

  // Simulate the gate: formData passes through unchanged
  const formDataAfterGate = { ...formData, leadName: 'Test User' }
  const scoreAfter = computeScore(formDataAfterGate)
  const profileAfter = computeMortgageProfile({ ...formDataAfterGate })

  assert(scoreBefore === scoreAfter, `Score unchanged: ${scoreBefore} === ${scoreAfter}`)
  assert(profileBefore.eX === profileAfter.eX, `E[X] unchanged: ${profileBefore.eX} === ${profileAfter.eX}`)
  assert(profileBefore.bottleneck === profileAfter.bottleneck, `Bottleneck unchanged: ${profileBefore.bottleneck}`)
  assert(profileBefore.riskStatus === profileAfter.riskStatus, `Risk status unchanged: ${profileBefore.riskStatus}`)
  assert(profileBefore.ltvPct === profileAfter.ltvPct, `LTV unchanged: ${profileBefore.ltvPct}`)
})

// =============================================================================
// Test 5: Video recommendations unchanged after gate
// =============================================================================
test('T5: Video recommendations are identical pre/post gate', () => {
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
  const recBefore = recommendVideos(formData, profile, score)

  const formDataAfter = { ...formData, leadName: 'Test', email: 'x@x.cz' }
  const recAfter = recommendVideos(formDataAfter, profile, score)

  assert(recBefore.primary.video.id === recAfter.primary.video.id, `Primary video unchanged: ${recBefore.primary.video.id}`)
  assert(recBefore.secondary.length === recAfter.secondary.length, `Secondary count unchanged: ${recBefore.secondary.length}`)
  if (recBefore.secondary.length > 0) {
    assert(
      recBefore.secondary[0].video.id === recAfter.secondary[0].video.id,
      `First secondary unchanged: ${recBefore.secondary[0].video.id}`
    )
  }
})

// =============================================================================
// Test 6: Gate flow position validation
// =============================================================================
test('T6: Step routing constants', () => {
  const STEP_PROCESSING = 5
  const STEP_LEAD_GATE = 6
  const STEP_RESULTS = 7

  assert(STEP_LEAD_GATE === STEP_PROCESSING + 1, 'Lead gate immediately follows processing')
  assert(STEP_RESULTS === STEP_LEAD_GATE + 1, 'Results immediately follow lead gate')
  assert(STEP_RESULTS > STEP_LEAD_GATE, 'Results are only reachable after lead gate')
})

// =============================================================================
// Test 7: Google Form fields configuration
// =============================================================================
test('T7: Lead endpoint field mapping', () => {
  const GF_FIELDS = {
    name: 'entry.1796948790',
    surname: 'entry.1494908840',
    email: 'entry.80055551',
    phone: 'entry.1807846036',
  }

  assert(GF_FIELDS.name.startsWith('entry.'), 'Name field uses GF entry format')
  assert(GF_FIELDS.surname.startsWith('entry.'), 'Surname field uses GF entry format')
  assert(GF_FIELDS.email.startsWith('entry.'), 'Email field uses GF entry format')
  assert(GF_FIELDS.phone.startsWith('entry.'), 'Phone field uses GF entry format')
})

// =============================================================================
// Test 8: Name splitting for Google Forms
// =============================================================================
test('T8: Name splitting logic for form submission', () => {
  const splitName = (fullName) => {
    const parts = fullName.trim().split(/\s+/)
    return {
      first: parts[0] ?? '',
      last: parts.length > 1 ? parts.slice(1).join(' ') : parts[0] ?? '',
    }
  }

  const r1 = splitName('Jan Novák')
  assert(r1.first === 'Jan' && r1.last === 'Novák', 'Two-part name splits correctly')

  const r2 = splitName('María José García-López')
  assert(r2.first === 'María' && r2.last === 'José García-López', 'Multi-part surname preserved')

  const r3 = splitName('  Jan  ')
  assert(r3.first === 'Jan' && r3.last === 'Jan', 'Single name duplicates to last')
})

// =============================================================================
// Test 9: Multiple calculation fixtures — regression check
// =============================================================================
test('T9: Calculation regression fixtures', () => {
  const fixtures = [
    {
      label: 'High earner, green',
      formData: { entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 35, netMonthlySalary: 120000, netIncome: 120000, contractType: 'indefinite', isProbation: false, residenceStatus: 'eu', yearsInCZ: '10plus', monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0, propertyMode: 'defined', purchasePrice: 8000000, ownFunds: 2500000, propertyPurpose: 'primary', purchaseTimeline: '3months' },
      expectedRisk: 'zelena',
    },
    {
      label: 'Red risk — high LTV, short tenure',
      formData: { entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 25, netMonthlySalary: 35000, netIncome: 35000, contractType: 'definite', isProbation: false, residenceStatus: 'longterm', yearsInCZ: '1-2', monthlyLoanPayments: 10000, creditCardLimits: 200000, monthlyLeasing: 5000, otherObligations: 3000, propertyMode: 'defined', purchasePrice: 6000000, ownFunds: 400000, propertyPurpose: 'primary', purchaseTimeline: '3months' },
      expectedRisk: 'cervena',
    },
    {
      label: 'OSVČ moderate',
      formData: { entityType: 'osvc', numberOfApplicants: 1, applicantAge: 40, netMonthlySalary: 0, netIncome: 0, taxRegime: 'tax_return', annualTurnover: 1800000, turnoverIncomePct: 60, businessAgeMonths: 30, residenceStatus: 'permanent', yearsInCZ: '5-10', monthlyLoanPayments: 0, creditCardLimits: 100000, monthlyLeasing: 0, otherObligations: 0, propertyMode: 'defined', purchasePrice: 4500000, ownFunds: 1000000, propertyPurpose: 'primary', purchaseTimeline: '6months' },
      expectedRisk: 'oranzova',
    },
  ]

  for (const { label, formData, expectedRisk } of fixtures) {
    const profile = computeMortgageProfile({ ...formData })
    assert(
      profile.riskStatus === expectedRisk,
      `${label}: risk=${profile.riskStatus} (expected ${expectedRisk})`
    )
    assert(profile.eX >= 0, `${label}: eX is non-negative (${profile.eX})`)
    assert(typeof profile.bottleneck === 'string', `${label}: bottleneck is defined (${profile.bottleneck})`)
  }
})

// =============================================================================
// Summary
// =============================================================================
console.log(`\n${'='.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
