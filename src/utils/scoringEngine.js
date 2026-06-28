/**
 * Czech Mortgage Pre-Scoring Engine — 2026
 * Methodology: Česká spořitelna, ČSOB, Komerční banka, mBank, UniCredit Bank
 */

// ─── Regulatory constants ────────────────────────────────────────────────────

export const CNB_DSTI_MAX    = 0.45    // Hard ČNB ceiling
export const LIVING_MIN_CZK  = 4_860   // Životní minimum, single adult (CZK/mo)

// Bank payoff age caps (Rozhodující osoba)
export const PAYOFF_AGES = {
  ucb:   70,   // UniCredit Bank — restrictive; 65 if applicant ≥60
  mbank: 70,   // mBank — same
  cs:    72,   // Česká spořitelna
  csob:  72,   // ČSOB
  kb:    75,   // Komerční banka — most generous
}

// Turnover-to-income coefficient for tax_return pathway (§7.6.1 conservative default)
// ČS: up to 0.70 for services; mBank: 0.60; UCB: sector-dependent. Using 0.55 as
// a conservative cross-bank average absent NACE sector data.
export const TURNOVER_COEFF_DEFAULT = 0.55

// Flat-tax (paušální daň) income coefficient — all four bank methodologies, 2026
export const FLAT_TAX_INCOME_COEFF = 0.60
export const FLAT_TAX_INCOME_CAP   = 150_000   // CZK/month hard ceiling per all methodologies

// Variance coefficients: capture cross-bank methodology spread (σ/E[X])
export const VAR_COEFF = {
  stable_employee:    0.02,   // indefinite + public sector + no probation
  standard_employee:  0.05,   // indefinite + private sector
  fixed_term:         0.12,   // smlouva na dobu určitou
  sro_mature:         0.10,   // s.r.o. ≥24 months
  osvc_mature:        0.15,   // OSVČ §7, ≥24 months
  osvc_young:         0.23,   // OSVČ 12–24 months
  osvc_new:           0.30,   // OSVČ <12 months (transition path)
  flat_tax:           0.18,   // Paušální daň — NACE methodology diverges most
}

// FX → CZK spot rates (conservative reference; updated quarterly)
export const FX_RATES_CZK = {
  EUR: 25.0,
  USD: 23.0,
  GBP: 29.5,
  CHF: 26.5,
}

// NACE net coefficients for flat-tax (paušální daň) income calculation
export const NACE_COEFFICIENTS = {
  it_consulting: 0.40,   // IT, consulting, liberal professions
  liberal:       0.35,   // lawyers, doctors, accountants
  trade:         0.25,
  craft:         0.20,
  default:       0.30,
}

// ─── Core math helpers ───────────────────────────────────────────────────────

/** Present-value annuity factor: Σ(1/(1+r)^t) for t=1..n */
export function annuityFactor(annualRatePct, months) {
  if (months <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return months
  return (1 - Math.pow(1 + r, -months)) / r
}

/** Monthly payment from principal, annual rate %, term in years */
export function monthlyPayment(principal, annualRatePct, years) {
  if (principal <= 0 || years <= 0) return 0
  const r = annualRatePct / 100 / 12
  const n = years * 12
  if (r === 0) return principal / n
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
}

// ─── LTV & DTI caps ──────────────────────────────────────────────────────────

/**
 * Max LTV by property purpose and applicant age:
 *   - Investment / 3rd+ property: hard 70% (all banks, no exceptions)
 *   - Primary housing, applicant <36: up to 90% (První bydlení framework)
 *   - Primary housing, applicant ≥36: 80% (CNB standard)
 *   - Holiday: treated as 80% (limited lender set)
 */
export function getMaxLTV(propertyPurpose, applicantAge) {
  if (propertyPurpose === 'investment') return 70
  if (applicantAge < 36)               return 90
  return 80
}

/**
 * Max DTI by property purpose:
 *   - Investment: 7 (all banks, strict)
 *   - Standard:   9.5 (CNB)
 */
export function getMaxDTI(propertyPurpose) {
  return propertyPurpose === 'investment' ? 7 : 9.5
}

// ─── Maturity model ──────────────────────────────────────────────────────────

/**
 * Maximum loan term in months based on applicant age and profile.
 *
 * Standard cap: 30 years (360 months).
 * mBank extended exception: 40 years (480 months) ONLY IF:
 *   LTV ≤80% AND DSTI ≤45% AND DTI ≤8.5
 *
 * Age constraint (conservative, UCB/mBank base):
 *   Payoff by age 70. If applicant ≥60 → UCB/mBank cap to payoff age 65.
 * KB is most generous at 75 (returned separately for display).
 */
export function calcMaxMaturity(applicantAge, ltvPct, dstiPct, dtiRatio) {
  const standardMax = 360   // 30 years
  const extendedMax = 480   // 40 years

  const canExtend = ltvPct <= 80 && dstiPct <= 45 && dtiRatio <= 8.5
  const policyMax = canExtend ? extendedMax : standardMax

  // UCB/mBank most restrictive payoff age
  const payoffAgeConservative = applicantAge >= 60 ? 65 : 70
  const payoffAgeGenerous     = PAYOFF_AGES.kb      // 75

  const monthsConservative = Math.max(0, (payoffAgeConservative - applicantAge) * 12)
  const monthsGenerous     = Math.max(0, (payoffAgeGenerous     - applicantAge) * 12)

  const maxMonths = Math.min(policyMax, monthsConservative)

  return {
    maxMonths,
    maxYears:             Math.floor(maxMonths / 12),
    monthsConservative,
    monthsGenerous,
    canExtend,
    policyMax,
    payoffAgeConservative,
    payoffAgeGenerous,
  }
}

// ─── Income adjustments ──────────────────────────────────────────────────────

/**
 * Applies bank methodology haircuts to raw net income.
 * Returns { baseIncome, effectiveIncome, haircut, flags, redFlags }
 *
 * flags    — soft warnings (reduce score, displayed to user)
 * redFlags — hard stops (effectively block approval at most banks)
 */
export function computeEffectiveIncome(formData) {
  const {
    entityType              = '',
    netIncome               = 0,
    netMonthlySalary        = null,
    contractType            = '',
    probationPeriod         = '',
    isProbation             = false,
    isNoticePeriod          = false,
    isOnSickLeave           = false,
    isEmployerDistressed    = false,
    employmentSector        = '',
    hasMonthlyDiety         = false,
    monthlyDiety            = null,
    hasFxIncome             = false,
    foreignSalaryAmount     = null,
    foreignSalaryCurrency   = 'EUR',
    hasOwnership            = false,
    employerOwnershipPct    = null,
    businessAgeMonths       = null,
    taxRegime               = '',
    annualTurnover          = null,
    avgMonthlyCreditTurnover = null,
  } = formData

  const flags    = []
  const redFlags = []
  let haircut = 1.0

  // ── Zaměstnanec ────────────────────────────────────────────────────────
  if (entityType === 'zamestnanec') {
    // Use new field with fallback to legacy
    const salary = Number(netMonthlySalary ?? netIncome ?? 0)

    // Hard blocks
    const inProbation = isProbation || probationPeriod === 'yes'
    if (isNoticePeriod)       redFlags.push('notice_period')
    if (isOnSickLeave)        redFlags.push('sick_leave')
    if (isEmployerDistressed) redFlags.push('employer_distressed')

    if (inProbation) {
      if (employmentSector === 'health' || employmentSector === 'education') {
        flags.push('probation_csob_exception')
      } else {
        redFlags.push('probation')
      }
    }

    // Contract type haircuts
    if      (contractType === 'definite') { haircut = 0.80; flags.push('fixed_term_20pct_haircut') }
    else if (contractType === 'agency')   { haircut = 0.75; flags.push('agency_contract_haircut')  }
    else if (contractType === 'dpc')      { haircut = 0.70; flags.push('dpc_contract_haircut')     }

    // FX income → CZK (85% of spot rate per ČS methodology)
    const fxRate  = FX_RATES_CZK[foreignSalaryCurrency] ?? FX_RATES_CZK.EUR
    const fxCZK   = hasFxIncome ? Number(foreignSalaryAmount || 0) * fxRate * 0.85 : 0
    const diet    = hasMonthlyDiety ? Number(monthlyDiety || 0) * 0.5 : 0
    const ownPct  = hasOwnership ? Number(employerOwnershipPct || 0) : 0

    // Per-bank effective incomes (before haircut)
    const csBase    = salary + diet + fxCZK
    const csobBase  = ownPct > 25 ? salary * 0.85 : salary
    const mbankBase = salary + diet  // mBank: domestic diet only, no FX
    const ucbBase   = ownPct > 33 ? 0 : salary  // UCB: hard cap at 33%

    // ČSOB blocked in probation (unless exception)
    const csobEligible = !inProbation || flags.includes('probation_csob_exception')

    const perBankIncome = {
      cs:    Math.round(csBase    * haircut),
      csob:  csobEligible ? Math.round(csobBase  * haircut) : 0,
      mbank: Math.round(mbankBase * haircut),
      ucb:   Math.round(ucbBase   * haircut),
    }

    if (fxCZK > 0) flags.push('fx_income_included')
    if (ownPct > 25) flags.push(ownPct > 33 ? 'ucb_ownership_hard_cap' : 'csob_ownership_haircut')

    // Cross-bank E[X]: mean of eligible (non-zero) bank incomes
    const eligibleIncomes = Object.values(perBankIncome).filter(v => v > 0)
    const effectiveIncome = eligibleIncomes.length > 0
      ? Math.round(eligibleIncomes.reduce((a, b) => a + b, 0) / eligibleIncomes.length)
      : 0

    return {
      baseIncome: salary,
      effectiveIncome,
      haircut,
      flags,
      redFlags,
      perBankIncome,
    }
  }

  let income = Number(netIncome)

  // ── OSVČ / s.r.o. ──────────────────────────────────────────────────────
  if (entityType === 'osvc' || entityType === 'sro') {

    // Step 1: Business age haircuts (applied regardless of income method)
    if (businessAgeMonths !== null) {
      if (businessAgeMonths < 3) {
        redFlags.push('business_too_new')
        return { baseIncome: 0, effectiveIncome: 0, haircut: 0, flags, redFlags }
      }
      if (businessAgeMonths < 12) {
        flags.push('transition_path_required')
        haircut = 0.70
        flags.push('under_12mo_30pct_haircut')
      } else if (businessAgeMonths < 24) {
        flags.push('under_24mo_15pct_haircut')
        haircut = 0.85
      }
    }

    // Step 2: Income method selection
    const monthlyCredit = Number(avgMonthlyCreditTurnover ?? 0)
    const turnover      = Number(annualTurnover ?? 0)

    if (taxRegime === 'flat_tax' && monthlyCredit >= 1) {
      // Obratová / paušální daň method — net income already derived by coefficient + deduction
      const gross = monthlyCredit * FLAT_TAX_INCOME_COEFF
      income = Math.min(Math.max(0, gross - LIVING_MIN_CZK), FLAT_TAX_INCOME_CAP)
      flags.push('flat_tax_method')
    } else if (taxRegime === 'tax_return' && turnover >= 1) {
      // Turnover pathway: compare with DAP-base and use the more favourable
      const turnoverMonthly = Math.round(turnover * TURNOVER_COEFF_DEFAULT / 12)
      if (turnoverMonthly > income) {
        income = turnoverMonthly
        flags.push('turnover_method')
      }
    }

    return {
      baseIncome:      income,
      effectiveIncome: Math.round(income * haircut),
      haircut,
      flags,
      redFlags,
    }
  }

  return { baseIncome: income, effectiveIncome: income, haircut: 1.0, flags, redFlags }
}

// ─── Variance coefficient ─────────────────────────────────────────────────────

export function computeVarianceCoeff(formData) {
  const {
    entityType            = '',
    contractType          = '',
    probationPeriod       = '',
    isProbation           = false,
    employmentSector      = '',
    hasFxIncome           = false,
    foreignSalaryAmount   = null,
    businessAgeMonths     = null,
    taxRegime             = '',
  } = formData

  if (entityType === 'zamestnanec') {
    const inProbation = isProbation || probationPeriod === 'yes'
    if (inProbation) return 0.20

    let v
    if      (contractType === 'definite') v = VAR_COEFF.fixed_term                    // 0.12
    else if (contractType === 'agency')   v = VAR_COEFF.fixed_term * 1.10             // 0.132
    else if (contractType === 'dpc')      v = VAR_COEFF.fixed_term * 1.20             // 0.144
    else {
      const isPublic = employmentSector === 'health' || employmentSector === 'education'
      v = isPublic ? VAR_COEFF.stable_employee : VAR_COEFF.standard_employee
    }
    if (hasFxIncome && Number(foreignSalaryAmount || 0) > 0) v += 0.05
    return Math.min(0.35, v)
  }

  if (entityType === 'sro') {
    let v = VAR_COEFF.sro_mature
    if (businessAgeMonths !== null && businessAgeMonths < 24) v += 0.08
    // Flat-tax 15% variance penalty: bank-statement methodology has higher spread
    if (taxRegime === 'flat_tax') v = Math.max(VAR_COEFF.flat_tax, v * 1.15)
    return Math.min(0.35, v)
  }

  if (entityType === 'osvc') {
    let v
    if      (businessAgeMonths === null || businessAgeMonths >= 24) v = VAR_COEFF.osvc_mature
    else if (businessAgeMonths >= 12)                               v = VAR_COEFF.osvc_young
    else                                                            v = VAR_COEFF.osvc_new
    if (taxRegime === 'flat_tax') v = Math.max(VAR_COEFF.flat_tax, v * 1.15)
    return Math.min(0.35, v)
  }

  return 0.15
}

// ─── Master profile engine ────────────────────────────────────────────────────

/**
 * Runs the full 2026 underwriting model and returns all derived values.
 * This is the single source of truth consumed by computeScore() and Step 7.
 *
 * E[X] formula (per spec):
 *   E[X] = min(
 *     (Net Income × Max DSTI − Existing Debt) × AnnuityFactor,
 *     Net Annual Income × Max DTI
 *   )
 */
export function computeMortgageProfile(formData) {
  const {
    applicantAge        = 35,
    purchasePrice       = 0,
    ownFunds            = 0,
    propertyPurpose     = 'primary',
    monthlyLoanPayments = 0,
    creditCardLimits    = 0,
    monthlyLeasing      = 0,
    otherObligations    = 0,
  } = formData

  // ── Obligations ─────────────────────────────────────────────────────────
  const cc5          = Math.round(Number(creditCardLimits) * 0.05)
  const existingDebt = Number(monthlyLoanPayments) + cc5 +
                       Number(monthlyLeasing) + Number(otherObligations)

  // ── Income with haircuts ─────────────────────────────────────────────────
  const incomeResult    = computeEffectiveIncome(formData)
  const { effectiveIncome, baseIncome, haircut, flags, redFlags } = incomeResult

  // ── LTV ─────────────────────────────────────────────────────────────────
  const loanAmount  = Math.max(0, Number(purchasePrice) - Number(ownFunds))
  const ltvPct      = purchasePrice > 0 ? (loanAmount / purchasePrice) * 100 : 0
  const maxLTVPct   = getMaxLTV(propertyPurpose, Number(applicantAge))
  const ltvBreached = purchasePrice > 0 && ltvPct > maxLTVPct

  // ── DTI ──────────────────────────────────────────────────────────────────
  const annualIncome = effectiveIncome * 12
  const dtiRatio     = annualIncome > 0 ? loanAmount / annualIncome : 0
  const maxDTIVal    = getMaxDTI(propertyPurpose)
  const dtiBreached  = annualIncome > 0 && loanAmount > 0 && dtiRatio > maxDTIVal

  // ── Tentative DSTI at 4.5%/30yr (for maturity eligibility check) ─────────
  const refRate       = 4.5
  const af30          = annuityFactor(refRate, 360)
  const tentPmt       = af30 > 0 ? loanAmount / af30 : 0
  const tentativeDSTI = effectiveIncome > 0
    ? ((tentPmt + existingDebt) / effectiveIncome) * 100 : 0

  // ── Max maturity ─────────────────────────────────────────────────────────
  const maturity = calcMaxMaturity(
    Number(applicantAge), ltvPct, tentativeDSTI, dtiRatio
  )

  // ── E[X] at base rate 4.5% / max maturity ────────────────────────────────
  const af       = annuityFactor(refRate, maturity.maxMonths)
  const afStress = annuityFactor(6.5,    maturity.maxMonths)

  // Monthly headroom under DSTI ceiling
  const headroom = Math.max(0, effectiveIncome * CNB_DSTI_MAX - existingDebt)

  const eXbyDSTI       = Math.round(headroom * af)
  const eXbyDSTIStress = Math.round(headroom * afStress)
  const eXbyDTI        = annualIncome > 0
    ? Math.round(annualIncome * maxDTIVal)
    : Number.MAX_SAFE_INTEGER

  const eX       = Math.min(eXbyDSTI,       eXbyDTI)
  const eXStress = Math.min(eXbyDSTIStress,  eXbyDTI)

  // ── Var[X] ───────────────────────────────────────────────────────────────
  const varCoeff = computeVarianceCoeff(formData)
  const varX     = Math.round(eX * varCoeff)

  // ── DSTI at the optimal E[X] loan ────────────────────────────────────────
  const optPayment = af > 0 ? eX / af : 0
  const dstiAtEX   = effectiveIncome > 0
    ? ((optPayment + existingDebt) / effectiveIncome) * 100 : 0

  // ── Bottleneck identification ─────────────────────────────────────────────
  let bottleneck
  if      (ltvBreached)                      bottleneck = 'LTV'
  else if (dtiBreached)                      bottleneck = 'DTI'
  else if (dstiAtEX > 45)                    bottleneck = 'DSTI'
  else if (maturity.maxMonths < 300 && Number(applicantAge) > 50) bottleneck = 'AGE'
  else if (eXbyDSTI <= eXbyDTI)              bottleneck = 'DSTI'
  else                                       bottleneck = 'DTI'

  // ── Risk matrix: Zelená / Oranžová / Červená ──────────────────────────────
  let riskStatus = 'zelena'
  const hardStop = ltvBreached || dtiBreached ||
    redFlags.includes('probation') || redFlags.includes('business_too_new')

  if (hardStop) {
    riskStatus = 'cervena'
  } else if (
    tentativeDSTI > 35 ||
    flags.includes('under_24mo_15pct_haircut') ||
    flags.includes('fixed_term_20pct_haircut') ||
    flags.includes('transition_path_required') ||
    ltvPct > 70 ||
    maturity.maxMonths < 240
  ) {
    riskStatus = 'oranzova'
  }

  return {
    // Income
    baseIncome, effectiveIncome, haircut, flags, redFlags,
    existingDebt, cc5,
    // Loan structure
    loanAmount, ltvPct, maxLTVPct, ltvBreached,
    // DTI
    dtiRatio, maxDTIVal, dtiBreached, annualIncome,
    // DSTI
    dstiAtEX, tentativeDSTI,
    // Maturity
    maturity,
    // E[X] / Var[X]
    eX, eXStress, varX, varCoeff,
    headroom, af, afStress,
    eXbyDSTI, eXbyDTI,
    // Risk
    bottleneck, riskStatus,
  }
}

// ─── Composite score (0–100) ─────────────────────────────────────────────────

export function computeScore(formData) {
  const {
    residenceStatus     = '',
    yearsInCZ           = '',
    propertyPurpose     = 'primary',
    purchaseTimeline    = '',
    purchasePrice       = 0,
    entityType          = '',
    businessAgeMonths   = null,
    bankAnalysisStatus  = '',
    bankAnalysisResults = null,
  } = formData

  const p = computeMortgageProfile(formData)
  let s = 0

  // Residence (20 pts)
  s += { eu: 20, permanent: 20, longterm5plus: 14, longterm: 9, employment: 4, other: 2 }[residenceStatus] ?? 6

  // Czech tenure (10 pts)
  s += { '10plus': 10, '5-10': 8, '2-5': 6, '1-2': 4, 'less1': 2 }[yearsInCZ] ?? 5

  // LTV (20 pts)
  if      (purchasePrice === 0)  s += 10
  else if (p.ltvPct <= 60)       s += 20
  else if (p.ltvPct <= 70)       s += 16
  else if (!p.ltvBreached)       s += 10

  // Obligation load (15 pts)
  if      (p.existingDebt === 0)      s += 15
  else if (p.existingDebt < 10_000)   s += 12
  else if (p.existingDebt < 20_000)   s += 8
  else if (p.existingDebt < 35_000)   s += 4

  // Property purpose (8 pts)
  s += { primary: 8, investment: 5, holiday: 3 }[propertyPurpose] ?? 0

  // Purchase timeline (7 pts)
  s += { '3months': 7, '6months': 5, '12months': 3, 'exploring': 1 }[purchaseTimeline] ?? 0

  // Bank scan (10 pts)
  if      (bankAnalysisStatus === 'done' && !bankAnalysisResults?.hasRedFlags) s += 10
  else if (bankAnalysisStatus === 'skipped' || !bankAnalysisStatus)            s += 6

  // Entity type (10 pts)
  s += { sro: 10, zamestnanec: 9, osvc: 7 }[entityType] ?? 0

  // ── Deductions ────────────────────────────────────────────────────────────

  if (bankAnalysisResults?.hasRedFlags)              s = Math.max(0, s - 15)
  if (p.redFlags.includes('probation'))              s = Math.max(0, s - 18)
  if (p.flags.includes('fixed_term_20pct_haircut'))  s = Math.max(0, s - 5)
  if (p.ltvBreached)                                 s = Math.max(0, s - 20)
  if (p.dtiBreached)                                 s = Math.max(0, s - 18)

  if (entityType === 'osvc' || entityType === 'sro') {
    if      (businessAgeMonths !== null && businessAgeMonths < 12) s = Math.max(0, s - 12)
    else if (businessAgeMonths !== null && businessAgeMonths < 24) s = Math.max(0, s - 5)
  }

  return Math.min(100, Math.max(0, s))
}
