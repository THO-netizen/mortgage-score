/**
 * Test suite for the deterministic video recommendation engine.
 * Run: node test-video-recommendations.mjs
 */

import { recommendVideos } from './src/utils/videoRecommender.js';
import { VIDEO_LIBRARY } from './src/data/videoLibrary.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function test(name, fn) {
  console.log(`\n${name}:`);
  fn();
}

/**
 * Shared structure verification for any recommendation result.
 */
function verifyStructure(result, label) {
  assert(result.primary !== null && result.primary !== undefined, `${label}: primary is not null`);
  assert(typeof result.primary.video.id === 'string' && result.primary.video.id.length > 0, `${label}: primary.video.id is a non-empty string`);
  assert(typeof result.primary.video.title === 'string' && result.primary.video.title.length > 0, `${label}: primary.video.title is a non-empty string`);
  assert(typeof result.primary.video.facebookUrl === 'string' && result.primary.video.facebookUrl.length > 0, `${label}: primary.video.facebookUrl is a non-empty string`);
  assert(Array.isArray(result.primary.video.topics) && result.primary.video.topics.length > 0, `${label}: primary.video.topics is a non-empty array`);
  assert(typeof result.primary.reason === 'string' && result.primary.reason.length > 0, `${label}: primary.reason is a non-empty string`);
  assert(Array.isArray(result.secondary), `${label}: secondary is an array`);
  assert(result.secondary.length >= 0 && result.secondary.length <= 2, `${label}: secondary has 0-2 items`);

  // Secondary items should not duplicate primary
  for (let i = 0; i < result.secondary.length; i++) {
    assert(
      result.secondary[i].video.id !== result.primary.video.id,
      `${label}: secondary[${i}] does not duplicate primary`
    );
  }

  // All recommended videos should be available
  assert(result.primary.video.available === true, `${label}: primary.video.available is true`);
  for (let i = 0; i < result.secondary.length; i++) {
    assert(result.secondary[i].video.available === true, `${label}: secondary[${i}].video.available is true`);
  }
}

// =============================================================================
// Test 1: First-time buyer with no property selected (exploring)
// =============================================================================
test('Test 1: First-time buyer exploring', () => {
  const formData = {
    entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 30,
    netMonthlySalary: 50000, netIncome: 50000,
    propertyMode: 'discovering', purchasePrice: 0, ownFunds: 0,
    propertyPurpose: 'primary', purchaseTimeline: '12months',
    monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0,
    residenceStatus: 'eu', yearsInCZ: '5-10',
  };
  const profile = { eX: 5000000, eXBase: 5000000, eXStress: 4000000, ltvPct: 0, ltvBreached: false, bottleneck: 'DSTI', riskStatus: 'zelena' };
  const score = 78;

  const result = recommendVideos(formData, profile, score);
  verifyStructure(result, 'T1');

  const primaryTopics = result.primary.video.topics;
  assert(
    primaryTopics.includes('affordability') || primaryTopics.includes('mortgage-capacity'),
    'T1: primary video has topic affordability or mortgage-capacity'
  );
  assert(
    result.primary.reason.toLowerCase().includes('exploring'),
    'T1: reason mentions exploring'
  );
});

// =============================================================================
// Test 2: Client already purchasing a specific property (urgent)
// =============================================================================
test('Test 2: Specific property, urgent timeline', () => {
  const formData = {
    entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 35,
    netMonthlySalary: 65000, netIncome: 65000,
    propertyMode: 'defined', purchasePrice: 6000000, ownFunds: 1200000,
    propertyPurpose: 'primary', purchaseTimeline: '3months',
    monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0,
    residenceStatus: 'eu', yearsInCZ: '10plus',
  };
  const profile = { eX: 5500000, eXBase: 5500000, eXStress: 4500000, ltvPct: 80, ltvBreached: false, bottleneck: 'LTV', riskStatus: 'oranzova' };
  const score = 75;

  const result = recommendVideos(formData, profile, score);
  verifyStructure(result, 'T2');

  const primaryTopics = result.primary.video.topics;
  assert(
    primaryTopics.includes('pre-approval') || primaryTopics.includes('reservation-agreement') ||
    primaryTopics.includes('escrow') || primaryTopics.includes('bank-valuation') ||
    primaryTopics.includes('LTV') || primaryTopics.includes('down-payment'),
    'T2: primary video has topic related to property purchase or LTV (high LTV rule also fires at 80%)'
  );
  const reasonLower = result.primary.reason.toLowerCase();
  assert(
    reasonLower.includes('property') || reasonLower.includes('three months') ||
    reasonLower.includes('ltv') || reasonLower.includes('own-funds'),
    'T2: reason mentions property, three months, LTV, or own-funds'
  );
});

// =============================================================================
// Test 3: Investment property client
// =============================================================================
test('Test 3: Investment property', () => {
  const formData = {
    entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 42,
    netMonthlySalary: 90000, netIncome: 90000,
    propertyMode: 'defined', purchasePrice: 8000000, ownFunds: 3000000,
    propertyPurpose: 'investment', purchaseTimeline: '6months',
    monthlyLoanPayments: 15000, creditCardLimits: 100000, monthlyLeasing: 0, otherObligations: 0,
    residenceStatus: 'permanent', yearsInCZ: '10plus',
  };
  const profile = { eX: 7000000, eXBase: 7000000, eXStress: 5500000, ltvPct: 62.5, ltvBreached: false, bottleneck: 'DSTI', riskStatus: 'zelena' };
  const score = 80;

  const result = recommendVideos(formData, profile, score);
  verifyStructure(result, 'T3');

  const primaryTopics = result.primary.video.topics;
  assert(
    primaryTopics.includes('bank-valuation') || primaryTopics.includes('interest-rates'),
    'T3: primary video has topic bank-valuation or interest-rates'
  );
});

// =============================================================================
// Test 4: High LTV client (limited own funds)
// =============================================================================
test('Test 4: High LTV client', () => {
  const formData = {
    entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 33,
    netMonthlySalary: 45000, netIncome: 45000,
    propertyMode: 'defined', purchasePrice: 5000000, ownFunds: 500000,
    propertyPurpose: 'primary', purchaseTimeline: '6months',
    monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0,
    residenceStatus: 'eu', yearsInCZ: '2-5',
  };
  const profile = { eX: 4000000, eXBase: 4000000, eXStress: 3200000, ltvPct: 90, ltvBreached: true, bottleneck: 'LTV', riskStatus: 'oranzova' };
  const score = 60;

  const result = recommendVideos(formData, profile, score);
  verifyStructure(result, 'T4');

  const primaryTopics = result.primary.video.topics;
  assert(
    primaryTopics.includes('LTV') || primaryTopics.includes('down-payment') || primaryTopics.includes('bank-valuation'),
    'T4: primary video has topic LTV, down-payment, or bank-valuation'
  );
  const reasonLower = result.primary.reason.toLowerCase();
  assert(
    reasonLower.includes('ltv') || reasonLower.includes('own-funds') || reasonLower.includes('own funds'),
    'T4: reason mentions LTV or own-funds'
  );
});

// =============================================================================
// Test 5: Married joint applicants
// =============================================================================
test('Test 5: Married joint applicants', () => {
  const formData = {
    entityType: 'zamestnanec', numberOfApplicants: 2, applicantAge: 38,
    netMonthlySalary: 70000, netIncome: 70000,
    propertyMode: 'defined', purchasePrice: 7000000, ownFunds: 1500000,
    propertyPurpose: 'primary', purchaseTimeline: '6months',
    monthlyLoanPayments: 5000, creditCardLimits: 50000, monthlyLeasing: 0, otherObligations: 0,
    residenceStatus: 'eu', yearsInCZ: '10plus',
  };
  const profile = { eX: 6000000, eXBase: 6000000, eXStress: 5000000, ltvPct: 78.6, ltvBreached: false, bottleneck: 'DSTI', riskStatus: 'zelena' };
  const score = 76;

  const result = recommendVideos(formData, profile, score);
  verifyStructure(result, 'T5');

  const primaryTopics = result.primary.video.topics;
  assert(
    primaryTopics.includes('pre-approval') || primaryTopics.includes('escrow') ||
    primaryTopics.includes('reservation-agreement') || primaryTopics.includes('bank-valuation') ||
    primaryTopics.includes('LTV') || primaryTopics.includes('down-payment'),
    'T5: primary video relates to property purchase process or LTV concerns'
  );
});

// =============================================================================
// Test 6: Young joint applicant with high LTV
// =============================================================================
test('Test 6: Young joint applicant with high LTV', () => {
  const formData = {
    entityType: 'zamestnanec', numberOfApplicants: 2, applicantAge: 28,
    netMonthlySalary: 55000, netIncome: 55000,
    propertyMode: 'defined', purchasePrice: 5500000, ownFunds: 600000,
    propertyPurpose: 'primary', purchaseTimeline: '6months',
    monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0,
    residenceStatus: 'eu', yearsInCZ: '2-5',
  };
  const profile = { eX: 4500000, eXBase: 4500000, eXStress: 3600000, ltvPct: 89, ltvBreached: true, bottleneck: 'LTV', riskStatus: 'oranzova' };
  const score = 62;

  const result = recommendVideos(formData, profile, score);
  verifyStructure(result, 'T6');

  const primaryTopics = result.primary.video.topics;
  assert(
    primaryTopics.includes('LTV') || primaryTopics.includes('down-payment'),
    'T6: primary video has topic LTV or down-payment'
  );
});

// =============================================================================
// Test 7: Affordability gap (eX < needed loan)
// =============================================================================
test('Test 7: Affordability gap', () => {
  const formData = {
    entityType: 'osvc', numberOfApplicants: 1, applicantAge: 40,
    netMonthlySalary: 0, netIncome: 60000,
    propertyMode: 'defined', purchasePrice: 10000000, ownFunds: 2000000,
    propertyPurpose: 'primary', purchaseTimeline: '6months',
    monthlyLoanPayments: 10000, creditCardLimits: 200000, monthlyLeasing: 5000, otherObligations: 0,
    residenceStatus: 'permanent', yearsInCZ: '10plus',
  };
  const profile = { eX: 5000000, eXBase: 5000000, eXStress: 4000000, ltvPct: 80, ltvBreached: false, bottleneck: 'DSTI', riskStatus: 'oranzova' };
  const score = 55;

  const result = recommendVideos(formData, profile, score);
  verifyStructure(result, 'T7');

  const primaryTopics = result.primary.video.topics;
  assert(
    primaryTopics.includes('mortgage-capacity') || primaryTopics.includes('affordability') ||
    primaryTopics.includes('bank-valuation') || primaryTopics.includes('LTV') || primaryTopics.includes('down-payment'),
    'T7: primary video has topic mortgage-capacity, affordability, or LTV-related (high LTV rule also fires at 80%)'
  );
  const reasonLower = result.primary.reason.toLowerCase();
  assert(
    reasonLower.includes('capacity') || reasonLower.includes('financing') ||
    reasonLower.includes('ltv') || reasonLower.includes('own-funds'),
    'T7: reason mentions capacity, financing, LTV, or own-funds'
  );
});

// =============================================================================
// Test 8: Red risk status (cervena)
// =============================================================================
test('Test 8: Red risk status', () => {
  const formData = {
    entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 35,
    netMonthlySalary: 40000, netIncome: 40000,
    propertyMode: 'defined', purchasePrice: 6000000, ownFunds: 500000,
    propertyPurpose: 'primary', purchaseTimeline: '6months',
    monthlyLoanPayments: 15000, creditCardLimits: 300000, monthlyLeasing: 8000, otherObligations: 5000,
    residenceStatus: 'longterm', yearsInCZ: '1-2',
  };
  const profile = { eX: 2500000, eXBase: 2500000, eXStress: 2000000, ltvPct: 91.7, ltvBreached: true, bottleneck: 'DI', riskStatus: 'cervena' };
  const score = 30;

  const result = recommendVideos(formData, profile, score);
  verifyStructure(result, 'T8');

  const primaryTopics = result.primary.video.topics;
  assert(
    primaryTopics.includes('rejected-application') || primaryTopics.includes('credit-profile') || primaryTopics.includes('mortgage-capacity'),
    'T8: primary video has topic rejected-application, credit-profile, or mortgage-capacity'
  );
  const reasonLower = result.primary.reason.toLowerCase();
  assert(
    reasonLower.includes('profile') || reasonLower.includes('flag'),
    'T8: reason mentions profile or flag'
  );
});

// =============================================================================
// Test 9: Clean profile without strong risk factor
// =============================================================================
test('Test 9: Clean profile, no strong risk', () => {
  const formData = {
    entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 32,
    netMonthlySalary: 80000, netIncome: 80000,
    propertyMode: 'defined', purchasePrice: 5000000, ownFunds: 2000000,
    propertyPurpose: 'primary', purchaseTimeline: '6months',
    monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0,
    residenceStatus: 'eu', yearsInCZ: '10plus',
  };
  const profile = { eX: 7000000, eXBase: 7000000, eXStress: 5500000, ltvPct: 60, ltvBreached: false, bottleneck: 'DSTI', riskStatus: 'zelena' };
  const score = 88;

  const result = recommendVideos(formData, profile, score);
  verifyStructure(result, 'T9');

  assert(
    result.primary !== null && result.primary.video !== null,
    'T9: still returns a primary recommendation even with no strong risk factors'
  );
  assert(
    typeof result.primary.reason === 'string' && result.primary.reason.length > 0,
    'T9: primary reason is a non-empty string'
  );
});

// =============================================================================
// Test 10: Determinism test (same input twice gives identical output)
// =============================================================================
test('Test 10: Determinism', () => {
  const formData = {
    entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 30,
    netMonthlySalary: 50000, netIncome: 50000,
    propertyMode: 'discovering', purchasePrice: 0, ownFunds: 0,
    propertyPurpose: 'primary', purchaseTimeline: '12months',
    monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0,
    residenceStatus: 'eu', yearsInCZ: '5-10',
  };
  const profile = { eX: 5000000, eXBase: 5000000, eXStress: 4000000, ltvPct: 0, ltvBreached: false, bottleneck: 'DSTI', riskStatus: 'zelena' };
  const score = 78;

  const result1 = recommendVideos(formData, profile, score);
  const result2 = recommendVideos(formData, profile, score);

  assert(
    result1.primary.video.id === result2.primary.video.id,
    'T10: primary video id is identical across two runs'
  );

  const secondaryIds1 = result1.secondary.map(s => s.video.id).join(',');
  const secondaryIds2 = result2.secondary.map(s => s.video.id).join(',');
  assert(
    secondaryIds1 === secondaryIds2,
    'T10: secondary video ids are identical across two runs'
  );
});

// =============================================================================
// Test 11: Multiple matching factors - no duplicates, correct count
// =============================================================================
test('Test 11: Multiple factors, no duplicates, correct structure', () => {
  // Reuse the red-risk case from Test 8 which triggers high LTV + affordability gap + risk
  const formData = {
    entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 35,
    netMonthlySalary: 40000, netIncome: 40000,
    propertyMode: 'defined', purchasePrice: 6000000, ownFunds: 500000,
    propertyPurpose: 'primary', purchaseTimeline: '6months',
    monthlyLoanPayments: 15000, creditCardLimits: 300000, monthlyLeasing: 8000, otherObligations: 5000,
    residenceStatus: 'longterm', yearsInCZ: '1-2',
  };
  const profile = { eX: 2500000, eXBase: 2500000, eXStress: 2000000, ltvPct: 91.7, ltvBreached: true, bottleneck: 'DI', riskStatus: 'cervena' };
  const score = 30;

  const result = recommendVideos(formData, profile, score);

  assert(
    result.primary !== null && result.primary !== undefined,
    'T11: exactly 1 primary recommendation'
  );
  assert(
    result.secondary.length <= 2,
    'T11: at most 2 secondary recommendations'
  );

  // Check no duplicates between primary and secondary
  const allIds = [result.primary.video.id, ...result.secondary.map(s => s.video.id)];
  const uniqueIds = new Set(allIds);
  assert(
    uniqueIds.size === allIds.length,
    'T11: no duplicate video ids between primary and secondary'
  );
});

// =============================================================================
// Test 12: Structure verification across all test cases
// =============================================================================
test('Test 12: Structure verification across varied inputs', () => {
  const testCases = [
    {
      formData: { entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 30, netMonthlySalary: 50000, netIncome: 50000, propertyMode: 'discovering', purchasePrice: 0, ownFunds: 0, propertyPurpose: 'primary', purchaseTimeline: '12months', monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0, residenceStatus: 'eu', yearsInCZ: '5-10' },
      profile: { eX: 5000000, eXBase: 5000000, eXStress: 4000000, ltvPct: 0, ltvBreached: false, bottleneck: 'DSTI', riskStatus: 'zelena' },
      score: 78,
    },
    {
      formData: { entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 35, netMonthlySalary: 65000, netIncome: 65000, propertyMode: 'defined', purchasePrice: 6000000, ownFunds: 1200000, propertyPurpose: 'primary', purchaseTimeline: '3months', monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0, residenceStatus: 'eu', yearsInCZ: '10plus' },
      profile: { eX: 5500000, eXBase: 5500000, eXStress: 4500000, ltvPct: 80, ltvBreached: false, bottleneck: 'LTV', riskStatus: 'oranzova' },
      score: 75,
    },
    {
      formData: { entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 42, netMonthlySalary: 90000, netIncome: 90000, propertyMode: 'defined', purchasePrice: 8000000, ownFunds: 3000000, propertyPurpose: 'investment', purchaseTimeline: '6months', monthlyLoanPayments: 15000, creditCardLimits: 100000, monthlyLeasing: 0, otherObligations: 0, residenceStatus: 'permanent', yearsInCZ: '10plus' },
      profile: { eX: 7000000, eXBase: 7000000, eXStress: 5500000, ltvPct: 62.5, ltvBreached: false, bottleneck: 'DSTI', riskStatus: 'zelena' },
      score: 80,
    },
    {
      formData: { entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 33, netMonthlySalary: 45000, netIncome: 45000, propertyMode: 'defined', purchasePrice: 5000000, ownFunds: 500000, propertyPurpose: 'primary', purchaseTimeline: '6months', monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0, residenceStatus: 'eu', yearsInCZ: '2-5' },
      profile: { eX: 4000000, eXBase: 4000000, eXStress: 3200000, ltvPct: 90, ltvBreached: true, bottleneck: 'LTV', riskStatus: 'oranzova' },
      score: 60,
    },
    {
      formData: { entityType: 'zamestnanec', numberOfApplicants: 2, applicantAge: 38, netMonthlySalary: 70000, netIncome: 70000, propertyMode: 'defined', purchasePrice: 7000000, ownFunds: 1500000, propertyPurpose: 'primary', purchaseTimeline: '6months', monthlyLoanPayments: 5000, creditCardLimits: 50000, monthlyLeasing: 0, otherObligations: 0, residenceStatus: 'eu', yearsInCZ: '10plus' },
      profile: { eX: 6000000, eXBase: 6000000, eXStress: 5000000, ltvPct: 78.6, ltvBreached: false, bottleneck: 'DSTI', riskStatus: 'zelena' },
      score: 76,
    },
    {
      formData: { entityType: 'zamestnanec', numberOfApplicants: 2, applicantAge: 28, netMonthlySalary: 55000, netIncome: 55000, propertyMode: 'defined', purchasePrice: 5500000, ownFunds: 600000, propertyPurpose: 'primary', purchaseTimeline: '6months', monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0, residenceStatus: 'eu', yearsInCZ: '2-5' },
      profile: { eX: 4500000, eXBase: 4500000, eXStress: 3600000, ltvPct: 89, ltvBreached: true, bottleneck: 'LTV', riskStatus: 'oranzova' },
      score: 62,
    },
    {
      formData: { entityType: 'osvc', numberOfApplicants: 1, applicantAge: 40, netMonthlySalary: 0, netIncome: 60000, propertyMode: 'defined', purchasePrice: 10000000, ownFunds: 2000000, propertyPurpose: 'primary', purchaseTimeline: '6months', monthlyLoanPayments: 10000, creditCardLimits: 200000, monthlyLeasing: 5000, otherObligations: 0, residenceStatus: 'permanent', yearsInCZ: '10plus' },
      profile: { eX: 5000000, eXBase: 5000000, eXStress: 4000000, ltvPct: 80, ltvBreached: false, bottleneck: 'DSTI', riskStatus: 'oranzova' },
      score: 55,
    },
    {
      formData: { entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 35, netMonthlySalary: 40000, netIncome: 40000, propertyMode: 'defined', purchasePrice: 6000000, ownFunds: 500000, propertyPurpose: 'primary', purchaseTimeline: '6months', monthlyLoanPayments: 15000, creditCardLimits: 300000, monthlyLeasing: 8000, otherObligations: 5000, residenceStatus: 'longterm', yearsInCZ: '1-2' },
      profile: { eX: 2500000, eXBase: 2500000, eXStress: 2000000, ltvPct: 91.7, ltvBreached: true, bottleneck: 'DI', riskStatus: 'cervena' },
      score: 30,
    },
    {
      formData: { entityType: 'zamestnanec', numberOfApplicants: 1, applicantAge: 32, netMonthlySalary: 80000, netIncome: 80000, propertyMode: 'defined', purchasePrice: 5000000, ownFunds: 2000000, propertyPurpose: 'primary', purchaseTimeline: '6months', monthlyLoanPayments: 0, creditCardLimits: 0, monthlyLeasing: 0, otherObligations: 0, residenceStatus: 'eu', yearsInCZ: '10plus' },
      profile: { eX: 7000000, eXBase: 7000000, eXStress: 5500000, ltvPct: 60, ltvBreached: false, bottleneck: 'DSTI', riskStatus: 'zelena' },
      score: 88,
    },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const { formData, profile, score } = testCases[i];
    const result = recommendVideos(formData, profile, score);
    verifyStructure(result, `T12-case${i + 1}`);
  }
});

// =============================================================================
// Summary
// =============================================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
