/**
 * Czech Mortgage Pre-Scoring Engine — 2026
 * Methodology: Česká spořitelna, ČSOB, Komerční banka, mBank, UniCredit Bank
 */

// ─── Regulatory constants ────────────────────────────────────────────────────

export const CNB_DSTI_MAX    = 0.45    // Hard ČNB ceiling
export const LIVING_MIN_CZK  = 4_860   // Životní minimum, single adult (CZK/mo)

// Household expense deducted per applicant from DSTI headroom (životní minimum)
export const LIVING_EXPENSE_PER_APPLICANT = 4_860   // CZK/mo per person (2026)

// Age-based eligibility thresholds (2026 standards)
export const FIRST_HOME_LTV_AGE_THRESHOLD = 36   // Strictly under this age → 90% LTV eligible
export const PAYOFF_AGE_MAX               = 75   // Absolute generous cap (KB); drives E[X] maturity

// Bank payoff age caps (Rozhodující osoba)
export const PAYOFF_AGES = {
  ucb:   70,   // UniCredit Bank — restrictive; 65 if applicant ≥60
  mbank: 70,   // mBank — same
  cs:    72,   // Česká spořitelna
  csob:  72,   // ČSOB
  kb:    75,   // Komerční banka — most generous (= PAYOFF_AGE_MAX)
}

// Contractual & stressed interest rates — business override: stress premium = +1 pp (not spec's +2 pp)
export const CONTRACT_RATE_PA      = 4.89   // % p.a. — Test A (DSTI formula at contract rate)
export const DUAL_STRESS_RATE_PA   = CONTRACT_RATE_PA + 1.0   // 5.89% — Test B (DI formula at stress rate)
export const STRESS_RATE_PA        = DUAL_STRESS_RATE_PA   // alias — equals 5.89% (business override)

// Turnover recognition default (spec v3.0: 0.70 is the standard per mBank/ČS/RB/UCB)
// KB/ČSOB use taxable-profit base — use same 0.70 as a conservative fallback.
export const TURNOVER_COEFF_DEFAULT = 0.70

// Flat-tax regime — same recognition coefficient as Branch A
export const FLAT_TAX_INCOME_COEFF = 0.70   // aligned with TURNOVER_COEFF_DEFAULT
export const FLAT_TAX_INCOME_CAP   = 150_000   // CZK/month hard ceiling (UCB: 170k)

// DI test: 5% reserve on top of living costs
export const RESERVE_KOEF = 0.05

// Living cost components for DI test (krok_3 aproximace)
export const HOUSING_COSTS_CZK       = 7_500   // náklady na bydlení per household
export const ZM_ADDITIONAL_ADULT_CZK = 4_470   // životní minimum, each additional adult

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

// ─── NACE sector → income recognition table ──────────────────────────────────
// Maps NACE division codes (2-digit prefix) to Czech mortgage income recognition
// percentages (tabulka uznatelných příjmů z obratu).  Upper bound is always used.

function buildNaceSectorTable() {
  const t = {}
  const set = (divs, pct, sector) => divs.forEach(d => { t[d] = { pct, sector } })

  // 70% — Finance, IT, Marketing, Consulting, Law, Arts, Research, Health
  set([64, 65, 66],             70, 'Finance & Accounting')
  set([58, 59, 60, 61, 62, 63], 70, 'IT & Technology')
  set([73],                     70, 'Marketing & Advertising')
  set([69, 70, 71, 85],         70, 'Consulting & Education')
  set([72],                     70, 'Research & Development')
  set([90, 91, 92, 93],         70, 'Arts, Culture & Sport')
  set([75, 86, 87, 88],         70, 'Healthcare')

  // 60% — Security, Real Estate
  set([68],                     60, 'Real Estate')
  set([80],                     60, 'Security & Protection')

  // 50% — Automotive, Transport, Beauty/Fashion/Design, Construction, Manufacturing
  set([45],                     50, 'Automotive')
  set([49, 50, 51, 52, 53],     50, 'Transport & Logistics')
  set([74, 96],                 50, 'Fashion, Design & Personal Care')
  set([41, 42, 43],             50, 'Construction & Trades')
  for (let d = 5; d <= 33; d++) t[d] = { pct: 50, sector: 'Manufacturing & Industry' }
  for (let d = 35; d <= 39; d++) t[d] = { pct: 50, sector: 'Manufacturing & Industry' }

  // 40% — Retail/Wholesale, Agriculture, Gastronomy, Direct sales
  set([1, 2, 3],                40, 'Agriculture & Forestry')
  set([46, 47],                 40, 'Retail & Wholesale')
  set([55, 56],                 40, 'Gastronomy & Hospitality')

  return t
}

export const NACE_SECTOR_TABLE = buildNaceSectorTable()

export const NACE_SECTOR_OPTIONS = [
  { sector: 'Finance & Accounting',          pct: 70 },
  { sector: 'IT & Technology',               pct: 70 },
  { sector: 'Marketing & Advertising',       pct: 70 },
  { sector: 'Consulting & Education',        pct: 70 },
  { sector: 'Research & Development',        pct: 70 },
  { sector: 'Arts, Culture & Sport',         pct: 70 },
  { sector: 'Healthcare',                    pct: 70 },
  { sector: 'Real Estate',                   pct: 60 },
  { sector: 'Security & Protection',         pct: 60 },
  { sector: 'Automotive',                    pct: 50 },
  { sector: 'Transport & Logistics',         pct: 50 },
  { sector: 'Fashion, Design & Personal Care', pct: 50 },
  { sector: 'Construction & Trades',         pct: 50 },
  { sector: 'Manufacturing & Industry',      pct: 50 },
  { sector: 'Agriculture & Forestry',        pct: 40 },
  { sector: 'Retail & Wholesale',            pct: 40 },
  { sector: 'Gastronomy & Hospitality',      pct: 40 },
]

/**
 * Maps a raw NACE code (any length string) to { pct, sector }.
 * pct is the income recognition % (40/50/60/70), sector is the Czech label.
 * Returns { pct: null, sector: '' } when no match.
 */
export function mapNaceToSector(naceCode) {
  if (!naceCode) return { pct: null, sector: '' }
  const div = parseInt(String(naceCode).slice(0, 2), 10)
  return NACE_SECTOR_TABLE[div] ?? { pct: null, sector: '' }
}

// ─── Bank profile tables (spec v3.0 — mapa_bank) ────────────────────────────

// KK (credit card limit) imputation coefficient per bank
export const BANK_KK_KOEF = {
  mbank: 0.05, kb: 0.05, csob: 0.05, cs: 0.05, rb: 0.05, ucb: 0.029,
}
// KTK (overdraft limit) imputation coefficient per bank
export const BANK_KTK_KOEF = {
  mbank: 0.05, kb: 0.05, csob: 0.05, cs: 0.05, rb: 0.05, ucb: 0.034,
}
// DTI limit (multiple of annual income)
export const BANK_DTI_LIMIT = {
  mbank: 8.5, kb: 9.5, csob: 12, cs: 9.5, rb: 9.5, ucb: 7,
}
export const BANK_KEYS = ['mbank', 'kb', 'csob', 'cs', 'rb', 'ucb']
export const BANK_NAMES = {
  mbank: 'mBank', kb: 'KB', csob: 'CSOB', cs: 'Ceska sporitelna',
  rb: 'Raiffeisenbank', ucb: 'UniCredit',
}

/**
 * Effective DSTI limit for a given bank based on applicant profile.
 * Returns null for UniCredit (no DSTI test — only DI test applies).
 *
 * @param {string}  bankKey        — one of BANK_KEYS
 * @param {number}  income         — effective monthly income (CZK)
 * @param {boolean} isYoung        — applicant age < 36
 * @param {boolean} isForeigner    — non-EU, non-permanent residence
 * @param {number}  ltvPct         — LTV percentage (0-100)
 * @param {boolean} isEnergyAB     — energy class A or B property (mBank +5% bonus)
 */
export function getBankEffectiveDSTI(bankKey, income, isYoung, isForeigner, ltvPct, isEnergyAB = false) {
  switch (bankKey) {
    case 'mbank': {
      // Income pasma: ≤30k→40%, ≤50k→50%, ≤100k→60%, >100k→65%
      // "neni OSTRE nad 100k" → income=100000 maps to do_100tis (0.60)
      let base = income > 100_000 ? 0.65
        : income > 50_000  ? 0.60
        : income > 30_000  ? 0.50
        : 0.40
      if (isEnergyAB) base = Math.min(0.65, base + 0.05)
      return base
    }
    case 'kb':   return 0.60   // "nizke riziko" standard
    case 'csob': return 0.55
    case 'cs':   return isYoung ? 0.60 : 0.55   // 0.60 if at least one applicant < 36
    case 'rb':
      if (isForeigner) return 0.45
      return ltvPct <= 70 ? 0.60 : 0.50
    case 'ucb':  return null   // no DSTI test — only Test B (DI) applies
    default:     return 0.45
  }
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
  if (propertyPurpose === 'investment')                       return 70
  if (applicantAge < FIRST_HOME_LTV_AGE_THRESHOLD)           return 90
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
 * Age constraint: payoff by PAYOFF_AGE_MAX (75, KB standard — most generous).
 * Conservative reference (UCB/mBank): payoff by 70, or 65 if applicant ≥60.
 */
export function calcMaxMaturity(applicantAge, ltvPct, dstiPct, dtiRatio) {
  const standardMax = 360   // 30 years
  const extendedMax = 480   // 40 years

  const canExtend = ltvPct <= 80 && dstiPct <= 45 && dtiRatio <= 8.5
  const policyMax = canExtend ? extendedMax : standardMax

  // Generous cap (KB / PAYOFF_AGE_MAX = 75) — drives E[X] and displayed max term
  const payoffAgeGenerous     = PAYOFF_AGE_MAX                               // 75
  // Conservative reference (UCB / mBank) — returned for per-bank context only
  const payoffAgeConservative = applicantAge >= 60 ? 65 : 70

  const monthsGenerous     = Math.max(0, (payoffAgeGenerous     - applicantAge) * 12)
  const monthsConservative = Math.max(0, (payoffAgeConservative - applicantAge) * 12)

  // maxMonths uses the generous (75) cap as the absolute ceiling
  const maxMonths = Math.min(policyMax, monthsGenerous)

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
    contractEndDate         = '',
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
    hasBonus                = false,
    bonusAmount             = null,
    bonusFrequency          = 'yearly',
    businessAgeMonths        = null,
    taxRegime                = '',
    annualTurnover           = null,
    avgMonthlyCreditTurnover = null,
    icoActiveStatus          = '',   // ARES stavEkonSubjektu — '' | 'AKTIVNÍ' | other
    turnoverIncomePct        = null, // NACE-derived income recognition % (40|50|60|70), null = use default
    // s.r.o. ESSO v2 fields (numeric)
    companyIncomeStream      = '',
    companyOwnershipPct      = null,
    companyExistenceMonths   = null,
    companyAfterTaxResult    = null,
    companyEquity            = null,
    dividendsPaidLast3Years  = null,
    directorContractExists   = false,
    sroDirectorSalary        = null,
    sroDirectorFees          = null,
    // v1 boolean fallbacks
    sroNegativeEquity        = false,
    sroNegativeProfit        = false,
    sroFullFiscalYear        = true,
    sroOwnershipPct          = null,
    sroProfitShare           = null,
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
    if (contractType === 'definite') {
      // Treated identically to indefinite — no haircut. Check if expiring soon.
      if (contractEndDate) {
        const now = new Date()
        const twoMo = new Date(now.getFullYear(), now.getMonth() + 2, 1)
        if (contractEndDate <= twoMo.toISOString().slice(0, 7)) {
          flags.push('fixed_term_expiring_soon')
        }
      }
    } else if (contractType === 'agency') {
      haircut = 0.75; flags.push('agency_contract_haircut')
    } else if (contractType === 'dpc') {
      haircut = 0.70; flags.push('dpc_contract_haircut')
    }

    // FX income → CZK (85% of spot rate per ČS methodology)
    const fxRate  = FX_RATES_CZK[foreignSalaryCurrency] ?? FX_RATES_CZK.EUR
    const fxCZK   = hasFxIncome ? Number(foreignSalaryAmount || 0) * fxRate * 0.85 : 0
    const diet    = hasMonthlyDiety ? Number(monthlyDiety || 0) * 0.5 : 0

    // Bonus: 50% recognition — standard conservative cross-bank haircut for variable income
    const bonusMonthly = hasBonus
      ? (bonusFrequency === 'yearly' ? Number(bonusAmount || 0) / 12 : Number(bonusAmount || 0))
      : 0
    const bonusRecognised = Math.round(bonusMonthly * 0.50)

    // Per-bank effective incomes (before contract haircut)
    const csBase    = salary + diet + fxCZK + bonusRecognised
    const mbankBase = salary + diet + bonusRecognised  // mBank: no FX
    const baseBonus = salary + bonusRecognised

    // ČSOB blocked in probation (unless exception)
    const csobEligible = !inProbation || flags.includes('probation_csob_exception')

    const perBankIncome = {
      cs:    Math.round(csBase    * haircut),
      csob:  csobEligible ? Math.round(baseBonus * haircut) : 0,
      mbank: Math.round(mbankBase * haircut),
      ucb:   Math.round(baseBonus * haircut),
    }

    if (fxCZK > 0)       flags.push('fx_income_included')
    if (bonusMonthly > 0) flags.push('bonus_income_included')

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

  // ── OSVČ ────────────────────────────────────────────────────────────────
  if (entityType === 'osvc') {

    // Hard block: inactive trade licence per ARES
    if (icoActiveStatus && icoActiveStatus !== 'AKTIVNÍ') {
      redFlags.push('osvc_inactive_licence')
      return { baseIncome: 0, effectiveIncome: 0, haircut: 0, flags, redFlags }
    }

    // Canonical age: prefer ARES-derived companyExistenceMonths, fall back to businessAgeMonths
    const ageMonths = companyExistenceMonths ?? businessAgeMonths

    if (ageMonths !== null) {
      if (ageMonths < 6) {
        // Under 6 months: all banks decline
        redFlags.push('business_too_new')
        return { baseIncome: 0, effectiveIncome: 0, haircut: 0, flags, redFlags }
      }
      if (ageMonths < 12) {
        // 6–12 months: UCB/mBank only (transition path) — 30% haircut, ČS/ČSOB excluded
        flags.push('transition_path_required')
        flags.push('osvc_6to12mo_ucb_mbank_only')
        haircut = 0.70
      } else if (ageMonths < 24) {
        // 12–24 months: all banks with 15% haircut
        flags.push('under_24mo_15pct_haircut')
        haircut = 0.85
      }
      // 24+ months: full recognition, haircut = 1.0
    }

    // Income method selection (krok_1b — spec v3.0)
    const coeff = (turnoverIncomePct !== null && turnoverIncomePct > 0)
      ? turnoverIncomePct / 100
      : TURNOVER_COEFF_DEFAULT   // 0.70 per spec default

    if (taxRegime === 'flat_tax') {
      // Branch B: monthly business income from bank statements
      const monthlyBI = Number(avgMonthlyCreditTurnover ?? 0)
      if (monthlyBI >= 1) {
        const uznatelny = monthlyBI * coeff
        income = Math.min(Math.round(uznatelny), FLAT_TAX_INCOME_CAP)
        flags.push('flat_tax_method')
      } else if (Number(annualTurnover ?? 0) >= 1) {
        // Legacy fallback if avgMonthlyCreditTurnover not yet entered
        income = Math.min(Math.round(Number(annualTurnover) / 12 * coeff), FLAT_TAX_INCOME_CAP)
        flags.push('flat_tax_method')
      }
    } else if (taxRegime === 'tax_return' && Number(annualTurnover ?? 0) >= 1) {
      // Branch A: obratová metoda — gross annual turnover ÷ 12 × recognition_koef
      const mesicniObrat = Number(annualTurnover) / 12
      income = Math.min(Math.round(mesicniObrat * coeff), FLAT_TAX_INCOME_CAP)
      flags.push('turnover_method')
    }

    return {
      baseIncome:      income,
      effectiveIncome: Math.round(income * haircut),
      haircut,
      flags,
      redFlags,
    }
  }

  // ── s.r.o. Director — ESSO v2 (per-bank Stream A/B/C methodology) ──────
  if (entityType === 'sro') {

    // Resolve numeric fields with boolean fallbacks for backward compat
    const equity   = Number(companyEquity         ?? NaN)
    const afterTax = Number(companyAfterTaxResult ?? NaN)
    const existMo  = Number(companyExistenceMonths ?? NaN)
    const ownPct   = Number(companyOwnershipPct   ?? sroOwnershipPct ?? 0)

    const negEquity = !isNaN(equity)   ? equity   < 0 : sroNegativeEquity
    const negProfit = !isNaN(afterTax) ? afterTax < 0 : sroNegativeProfit
    const noHistory = !isNaN(existMo)  ? existMo  < 12 : (sroFullFiscalYear === false)

    if (negEquity || negProfit) {
      redFlags.push('sro_negative_financials')
      return { baseIncome: 0, effectiveIncome: 0, haircut: 0, flags, redFlags, perBankIncome: {} }
    }
    if (noHistory) {
      redFlags.push('sro_insufficient_history')
      return { baseIncome: 0, effectiveIncome: 0, haircut: 0, flags, redFlags, perBankIncome: {} }
    }

    if (ownPct > 50) flags.push('sro_full_audit_required')

    // ESSO risk tier: medium risk applies 50% cap
    const effectiveExistMo = !isNaN(existMo) ? existMo : (businessAgeMonths ?? null)
    if (effectiveExistMo !== null && effectiveExistMo >= 12 && effectiveExistMo < 24) {
      haircut = 0.50
      flags.push('sro_medium_risk_50pct_cap')
    }

    // ── Parse active income streams ───────────────────────
    const streams = String(companyIncomeStream || '')
    const hasA = streams.includes('A')
    const hasB = streams.includes('B')
    const hasC = streams.includes('C') && directorContractExists

    // ── Per-bank per-stream incomes ───────────────────────
    const salary  = Number(sroDirectorSalary ?? netIncome ?? 0)
    const fees    = Number(sroDirectorFees   ?? 0)
    const divPaid = Number(dividendsPaidLast3Years ?? sroProfitShare ?? 0)

    // Stream A: director salary
    const aCS   = hasA ? salary : 0
    const aCSoB = hasA ? (ownPct > 25 ? salary * 0.85 : salary) : 0
    const aMB   = hasA ? salary : 0
    const aUCB  = hasA ? (ownPct > 33 ? Math.min(salary, 45_000) : salary) : 0

    // Stream B: profit share / dividends
    const profitShare = !isNaN(afterTax) ? afterTax * (ownPct / 100) : 0
    const bCS   = hasB ? Math.round(profitShare / 12 * 0.80) : 0
    const bCSoB = hasB ? Math.round(profitShare / 12 * 0.85) : 0
    const bMB   = hasB ? Math.round(divPaid * 0.85 / 36)     : 0  // 15% withholding
    const bUCB  = hasB ? Math.round(divPaid / 36)             : 0

    // Stream C: director fees (contract required)
    const cCS   = hasC ? fees : 0
    const cCSoB = hasC ? (ownPct > 25 ? fees * 0.85 : fees) : 0
    const cMB   = hasC ? fees : 0
    const cUCB  = hasC ? (ownPct > 33 ? Math.min(fees, 45_000) : fees) : 0

    // Sum all streams per bank then apply medium-risk haircut
    const perBankIncome = {
      cs:   Math.round((aCS   + bCS   + cCS)   * haircut),
      csob: Math.round((aCSoB + bCSoB + cCSoB) * haircut),
      mbank: Math.round((aMB  + bMB   + cMB)   * haircut),
      ucb:  Math.round((aUCB  + bUCB  + cUCB)  * haircut),
    }

    // Cross-bank E[X] = mean of eligible (non-zero) banks
    const eligible = Object.values(perBankIncome).filter(v => v > 0)
    const effectiveIncome = eligible.length > 0
      ? Math.round(eligible.reduce((a, b) => a + b, 0) / eligible.length)
      : 0

    const baseIncome = Math.round((aCS + bCS + cCS) / (haircut > 0 ? haircut : 1)) // ČS pre-haircut as reference

    return {
      baseIncome,
      effectiveIncome,
      haircut,
      flags,
      redFlags,
      perBankIncome,
    }
  }

  return { baseIncome: income, effectiveIncome: income, haircut: 1.0, flags, redFlags }
}

// ─── Variance coefficient ─────────────────────────────────────────────────────

export function computeVarianceCoeff(formData) {
  const {
    entityType              = '',
    contractType            = '',
    probationPeriod         = '',
    isProbation             = false,
    employmentSector        = '',
    hasFxIncome             = false,
    foreignSalaryAmount     = null,
    businessAgeMonths       = null,
    taxRegime               = '',
    companyIncomeStream     = '',
    companyOwnershipPct     = null,
    companyExistenceMonths  = null,
  } = formData

  if (entityType === 'zamestnanec') {
    const inProbation = isProbation || probationPeriod === 'yes'
    if (inProbation) return 0.20

    let v
    if      (contractType === 'definite') v = VAR_COEFF.standard_employee              // same as indefinite
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
    const streams  = String(companyIncomeStream || '')
    const hasA     = streams.includes('A')
    const hasB     = streams.includes('B')
    const hasC     = streams.includes('C')
    const ownPct   = Number(companyOwnershipPct ?? 0)
    const existMo  = companyExistenceMonths !== null ? Number(companyExistenceMonths) : businessAgeMonths

    // Base: 0.20. Stream-specific additions (take dominant stream's penalty)
    let v = 0.20
    if (hasB) v = Math.max(v, 0.20 + 0.35)   // Stream B: +35% — highest penalty
    else if (hasC) v = Math.max(v, 0.20 + 0.15) // Stream C: +15%
    else if (hasA) {
      // Stream A: +10–20% by ownership stake
      const aAdd = ownPct > 50 ? 0.20 : ownPct > 25 ? 0.15 : 0.10
      v = Math.max(v, 0.20 + aAdd)
    }
    // Young company floor
    if (existMo !== null && existMo < 24) v = Math.max(v, 0.27)
    return Math.min(0.35, v)
  }

  if (entityType === 'osvc') {
    const ageMonths = companyExistenceMonths ?? businessAgeMonths
    let v
    if      (ageMonths === null || ageMonths >= 24) v = VAR_COEFF.osvc_mature
    else if (ageMonths >= 12)                       v = VAR_COEFF.osvc_young
    else                                            v = VAR_COEFF.osvc_new
    if (taxRegime === 'flat_tax') v = Math.max(VAR_COEFF.flat_tax, v * 1.15)
    return Math.min(0.35, v)
  }

  return 0.15
}

// ─── Master profile engine (spec v3.0 — Dvojtest) ────────────────────────────

/**
 * Runs the full Dvojtest underwriting model per spec v3.0:
 *   krok_2 Test A (DSTI): max_loan = (DSTI_limit × income − obligations) × PV_factor(4.89%)
 *   krok_3 Test B (DI):   max_loan = (income − living_costs − 5%reserve − obligations) × PV_factor(5.89%)
 *   krok_4 bonita[bank] = MIN(Test A, Test B)
 *   krok_5 DTI cap
 *   krok_6 LTV cap (only when purchasePrice > 0; skipped otherwise → Infinity)
 *   krok_7 max_loan[bank] = MIN(bonita, DTI_cap, LTV_cap)
 *   krok_8 winner = argmax_by_maxLoan (NOT argmax_by_DSTI per spec)
 *   eX = max_loan[winner]
 */
export function computeMortgageProfile(formData) {
  const {
    applicantAge        = 35,
    numberOfApplicants  = 1,
    purchasePrice       = 0,
    ownFunds            = 0,
    propertyPurpose     = 'primary',
    monthlyLoanPayments = 0,
    creditCardLimits    = 0,
    monthlyLeasing      = 0,
    otherObligations    = 0,
    residenceStatus     = '',
  } = formData

  const age       = Number(applicantAge)
  const isYoung   = age < FIRST_HOME_LTV_AGE_THRESHOLD
  // RB restricts to 0.45 DSTI for non-EU/non-permanent applicants
  const isForeigner = !['eu', 'permanent'].includes(residenceStatus)

  // ── Income with haircuts ──────────────────────────────────────────────────
  const incomeResult = computeEffectiveIncome(formData)
  const { effectiveIncome, baseIncome, haircut, flags, redFlags, perBankIncome = {} } = incomeResult

  // ── LTV ──────────────────────────────────────────────────────────────────
  const loanAmount  = Math.max(0, Number(purchasePrice) - Number(ownFunds))
  const ltvPct      = purchasePrice > 0 ? (loanAmount / purchasePrice) * 100 : 0
  const maxLTVPct   = getMaxLTV(propertyPurpose, age)
  const ltvBreached = purchasePrice > 0 && ltvPct > maxLTVPct
  const ltvCapLoan  = purchasePrice > 0 ? (maxLTVPct / 100) * Number(purchasePrice) : Infinity

  // ── Max maturity ─────────────────────────────────────────────────────────
  // Use standard (30yr) cap by default. The 40yr extension is mBank-specific and
  // requires knowing final DSTI/DTI — not knowable before the per-bank loop.
  const maturity = calcMaxMaturity(age, ltvPct, 46, 99)

  // ── Annuity factors: PV factor = loan / monthly_payment ──────────────────
  // loan = payment × PV_factor  →  max_loan = free_payment × PV_factor
  // Two rates: 4.89% (Test A / DSTI) and 5.89% (Test B / DI stress = contract + 1 pp)
  const af           = annuityFactor(CONTRACT_RATE_PA,    maturity.maxMonths)  // 4.89% — Test A (DSTI)
  const afDualStress = annuityFactor(DUAL_STRESS_RATE_PA, maturity.maxMonths)  // 5.89% — Test B (DI stress)
  const afStress     = afDualStress                                             // alias — same rate

  // ── Obligations (base — KK coeff applied per bank below) ─────────────────
  const splatky  = Number(monthlyLoanPayments) + Number(monthlyLeasing) + Number(otherObligations)
  const kkLimits = Number(creditCardLimits)
  const cc5      = Math.round(kkLimits * 0.05)   // display field (standard 5%)

  // ── Living costs for DI test (krok_3) ────────────────────────────────────
  const adults      = Math.max(1, Number(numberOfApplicants))
  const zmTotal     = LIVING_MIN_CZK + Math.max(0, adults - 1) * ZM_ADDITIONAL_ADULT_CZK
  const livingCosts = zmTotal + HOUSING_COSTS_CZK           // ZM + housing per household
  const reserve     = Math.round(livingCosts * RESERVE_KOEF)  // 5% reserve
  const householdExpenses = livingCosts + reserve            // total DI-test deduction

  // ── Per-bank Dvojtest ────────────────────────────────────────────────────
  const bankResults = {}

  for (const key of BANK_KEYS) {
    const koefKK = BANK_KK_KOEF[key]
    const dtiLim  = BANK_DTI_LIMIT[key]

    // Use per-bank income for s.r.o. (ESSO streams differ); fallback = effectiveIncome
    const bIncome = (perBankIncome[key] !== undefined && perBankIncome[key] > 0)
      ? perBankIncome[key]
      : effectiveIncome

    const effectiveDSTI = getBankEffectiveDSTI(key, bIncome, isYoung, isForeigner, ltvPct)
    const totalObl      = splatky + kkLimits * koefKK   // KTK not collected → 0

    // krok_2 — Test A: DSTI at contract rate (4.89%)
    // max_uver_dle_DSTI = (DSTI_limit × income − obligations) / annuity_factor_4.89%
    let maxByDSTI = Infinity
    if (effectiveDSTI !== null) {
      const volnaSplatka = Math.max(0, effectiveDSTI * bIncome - totalObl)
      maxByDSTI = Math.round(volnaSplatka * af)
    }

    // krok_3 — Test B: Disponibilní příjem (DI) at stress rate (5.89% = contract + 1 pp)
    // max_uver_dle_DI = (income − living_costs − reserve − obligations) / annuity_factor_5.89%
    const disponibilni   = Math.max(0, bIncome - livingCosts - reserve - totalObl)
    const maxByDI        = Math.round(disponibilni * afDualStress)
    const maxByDSTI_stress = maxByDI   // alias kept for backward-compat in bankResults object

    // krok_4: bonita = MIN(Test A, Test B) per spec — takes the lower of the two
    const bonita = Math.min(maxByDSTI, maxByDI)

    // krok_5: DTI cap
    const maxByDTI = isFinite(dtiLim) ? Math.round(bIncome * 12 * dtiLim) : Infinity

    // krok_6: LTV cap — Infinity when purchasePrice = 0 (discovery mode → skip)
    const maxByLTV = isFinite(ltvCapLoan) ? Math.round(ltvCapLoan) : Infinity

    // krok_7: bank result
    const maxLoan = Math.max(0, Math.min(bonita, maxByDTI, maxByLTV))

    // Binding constraint (internal — never shown to client per PRAVIDLO_ANONYMITY)
    let binding
    if      (maxByLTV < bonita && maxByLTV <= maxByDTI) binding = 'LTV'
    else if (maxByDTI < bonita)                         binding = 'DTI'
    else if (maxByDI  < maxByDSTI)                      binding = 'DI'
    else                                                binding = 'DSTI'

    bankResults[key] = { effectiveDSTI, maxByDSTI, maxByDSTI_stress, maxByDI, bonita, maxByDTI, maxLoan, binding }
  }

  // ── krok_8: select winning bank (argmax by maxLoan per spec v3.0) ──────────
  // Spec: "vitezna_banka = argmax_po_bankach(max_uver[banka])"
  // NOT argmax(DSTI) — highest DSTI does not guarantee highest amount when other limits bind.
  let winnerKey  = BANK_KEYS[0]
  let winnerLoan = bankResults[BANK_KEYS[0]].maxLoan

  for (const key of BANK_KEYS.slice(1)) {
    if (bankResults[key].maxLoan > winnerLoan) {
      winnerKey  = key
      winnerLoan = bankResults[key].maxLoan
    }
  }

  const winner   = bankResults[winnerKey]
  const eX       = Math.max(0, winner.maxLoan)
  // eXBase:   Test A capacity (DSTI@4.89%) — always ≥ eX when DTI/LTV also bind
  const eXBase   = Math.max(0, isFinite(winner.maxByDSTI) ? winner.maxByDSTI : eX)
  // eXStress: Test B capacity (DI@5.89%) — disponibilní příjem limit (pre LTV/DTI caps)
  const eXStress = Math.max(0, isFinite(winner.maxByDI)   ? winner.maxByDI   : 0)

  // krok_9: REVERZNI_DOPOCET_CENY_NEMOVITOSTI (discovery mode — no property defined)
  // Derive max property price and minimum own funds from income-limited max loan.
  // Uses age-based LTV only: ≤35 → 90%, 36+ → 80% (primary residence standard).
  const discoveryLTVPct  = isYoung ? 90 : 80
  const maxPropertyPrice = eX > 0 ? Math.round(eX / (discoveryLTVPct / 100)) : 0
  const minOwnFunds      = maxPropertyPrice > 0 ? maxPropertyPrice - eX : 0

  // ── Derived legacy fields ─────────────────────────────────────────────────
  const annualIncome = effectiveIncome * 12
  const maxDTIVal    = getMaxDTI(propertyPurpose)
  const dtiRatio     = annualIncome > 0 ? loanAmount / annualIncome : 0
  const dtiBreached  = annualIncome > 0 && loanAmount > 0 && dtiRatio > maxDTIVal

  const existingDebt = splatky + cc5   // display field

  // DSTI at eX for display (monthly payment / income)
  const optPayment  = af > 0 ? eX / af : 0
  const dstiAtEX    = effectiveIncome > 0 ? (optPayment / effectiveIncome) * 100 : 0
  const tentativeDSTI = dstiAtEX

  // Legacy eXbyDSTI / eXbyDTI from winning bank for backward compat
  const eXbyDSTI = isFinite(winner.maxByDSTI) ? winner.maxByDSTI : eX
  const eXbyDTI  = isFinite(winner.maxByDTI)  ? winner.maxByDTI  : eX

  // Headroom at CNB 45% (legacy display field — not used in dual test)
  const headroom = Math.max(0, effectiveIncome * CNB_DSTI_MAX - existingDebt)

  // ── Var[X] ────────────────────────────────────────────────────────────────
  const varCoeff = computeVarianceCoeff(formData)
  const varX     = Math.round(eX * varCoeff)

  // ── Bottleneck (profile-level — internal; generic label shown to client) ──
  // Values: 'DSTI' | 'DI' | 'DTI' | 'LTV' | 'AGE'
  let bottleneck
  if      (ltvBreached)                          bottleneck = 'LTV'
  else if (dtiBreached)                          bottleneck = 'DTI'
  else if (age > 50 && maturity.maxMonths < 300) bottleneck = 'AGE'
  else                                           bottleneck = winner.binding

  // ── Risk matrix ───────────────────────────────────────────────────────────
  let riskStatus = 'zelena'
  const hardStop = ltvBreached || dtiBreached ||
    redFlags.includes('probation') || redFlags.includes('business_too_new') ||
    redFlags.includes('osvc_inactive_licence') ||
    redFlags.includes('sro_negative_financials') || redFlags.includes('sro_insufficient_history')

  if (hardStop) {
    riskStatus = 'cervena'
  } else if (
    tentativeDSTI > 35 ||
    flags.includes('under_24mo_15pct_haircut') ||
    flags.includes('fixed_term_expiring_soon') ||
    flags.includes('transition_path_required') ||
    flags.includes('sro_medium_risk_50pct_cap') ||
    flags.includes('sro_full_audit_required') ||
    ltvPct > 70 ||
    maturity.maxMonths < 240
  ) {
    riskStatus = 'oranzova'
  }

  return {
    // Income
    baseIncome, effectiveIncome, haircut, flags, redFlags, perBankIncome,
    existingDebt, cc5, householdExpenses, numberOfApplicants,
    livingCosts, reserve,
    // Loan structure
    loanAmount, ltvPct, maxLTVPct, ltvBreached,
    // DTI
    dtiRatio, maxDTIVal, dtiBreached, annualIncome,
    // DSTI
    dstiAtEX, tentativeDSTI,
    // Maturity
    maturity,
    // E[X] / Var[X]
    eX, eXStress, eXBase, varX, varCoeff,
    headroom, af, afDualStress, afStress,
    eXbyDSTI, eXbyDTI,
    // krok_9 discovery outputs (valid whenever purchasePrice === 0)
    discoveryLTVPct, maxPropertyPrice, minOwnFunds,
    // Risk
    bottleneck, riskStatus,
    // Per-bank results (new — Step 7 can surface these)
    bankResults, winnerBank: winnerKey,
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
  s += { eu: 20, permanent: 20, longterm5plus: 14, longterm: 9, employment: 9, other: 2 }[residenceStatus] ?? 6

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
  if (p.flags.includes('fixed_term_expiring_soon'))  s = Math.max(0, s - 3)
  if (p.ltvBreached)                                 s = Math.max(0, s - 20)
  if (p.dtiBreached)                                 s = Math.max(0, s - 18)

  if (entityType === 'osvc' || entityType === 'sro') {
    // Use ARES-derived age if available, fall back to ARES businessAgeMonths
    const ageForScore = formData.companyExistenceMonths ?? businessAgeMonths
    if      (ageForScore !== null && ageForScore < 12) s = Math.max(0, s - 12)
    else if (ageForScore !== null && ageForScore < 24) s = Math.max(0, s - 5)
  }

  // OSVČ ARES deductions
  if (p.redFlags.includes('osvc_inactive_licence'))    s = Math.max(0, s - 30)
  if (p.flags.includes('osvc_6to12mo_ucb_mbank_only')) s = Math.max(0, s - 8)

  // ESSO s.r.o. deductions
  if (p.redFlags.includes('sro_negative_financials'))  s = Math.max(0, s - 25)
  if (p.redFlags.includes('sro_insufficient_history')) s = Math.max(0, s - 15)
  if (p.flags.includes('sro_medium_risk_50pct_cap'))   s = Math.max(0, s - 8)
  if (p.flags.includes('sro_full_audit_required'))     s = Math.max(0, s - 3)

  return Math.min(100, Math.max(0, s))
}
