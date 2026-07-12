// ── Dynamic narrative generation engine ────────────────────────────────────
// Interprets calculator data into unique, human-readable commentary.

import { czkShort, czk, pct, entityLabel, residenceLabel, scoreLabel } from './styles.js'

// ── Executive Summary ───────────────────────────────────────────────────────

export function buildExecutiveSummary(formData, profile, score) {
  const { eX, eXStress, effectiveIncome, bottleneck, flags = [], redFlags = [] } = profile
  const { entityType, leadName, purchasePrice, ownFunds } = formData
  const name = (leadName ?? '').trim().split(' ')[0] || 'The applicant'

  const loanAmt = Math.max(0, (purchasePrice || 0) - (ownFunds || 0))
  const gap     = loanAmt > 0 && eX > 0 ? loanAmt - eX : null
  const feasible = eX >= loanAmt && loanAmt > 0

  const strengthMap = { strong: 75, good: 55, review: 35, risk: 0 }
  const tier = score >= 75 ? 'strong' : score >= 55 ? 'good' : score >= 35 ? 'review' : 'risk'

  const openers = {
    strong: `${name}'s mortgage eligibility profile is strong. Recognised monthly income of ${czk(effectiveIncome)} generates a Czech-bank maximum loan capacity of approximately ${czkShort(eX)}, comfortably clearing the stress-test threshold at ${czkShort(eXStress)}. The application is eligible for assessment by all major covered lenders under standard underwriting pathways.`,
    good:   `${name}'s profile presents a viable mortgage pathway with selected lenders. A recognised monthly income of ${czk(effectiveIncome)} supports a maximum loan of approximately ${czkShort(eX)}, with a stress-tested floor of ${czkShort(eXStress)}. ${bottleneck === 'DSTI' ? 'Debt service obligations are the primary binding variable.' : bottleneck === 'DTI' ? 'The total debt-to-income multiple is the primary constraint.' : 'Loan-to-Value structure requires careful calibration.'}`,
    review: `${name}'s profile requires targeted optimisation before the strongest lender selection is available. The recognised income of ${czk(effectiveIncome)} yields a capacity of ${czkShort(eX)}, though ${bottleneck ?? 'structural factors'} currently act as the limiting constraint. Strategic adjustments outlined in this report can materially improve this position within 3–6 months.`,
    risk:   `${name}'s current profile faces significant structural barriers that prevent standard Czech mortgage processing. Recognised income of ${czk(effectiveIncome)} translates to a theoretical capacity of ${czkShort(eX)}, but active risk flags — detailed in this assessment — must be resolved before approaching lenders. This report provides a concrete remediation roadmap.`,
  }

  const feasibilityLine = feasible
    ? `The target acquisition at ${czk(purchasePrice)} is within the assessed capacity range. The loan requirement of ${czkShort(loanAmt)} falls ${czkShort(eX - loanAmt)} below the theoretical maximum, providing comfortable underwriting headroom.`
    : gap && gap > 0
    ? `The target acquisition at ${czk(purchasePrice)} requires a loan of ${czkShort(loanAmt)}, which exceeds the current assessed maximum by ${czkShort(gap)}. Closing this gap requires either a purchase price reduction, increased own funds, or income growth — each route is modelled in the Scenario Comparison section.`
    : ''

  const incomeNote = entityType === 'osvc'
    ? `As a self-employed applicant, income is assessed under Czech bank NACE methodology — the recognition coefficient applied to business turnover rather than taxable profit — which is the most direct lever for capacity improvement.`
    : entityType === 'sro'
    ? `As a company director, income is assessed under ESSO (Economically Self-related Subject Owner) methodology, requiring a more detailed document package and stricter bank-by-bank underwriting.`
    : `Salaried income provides the most predictable underwriting pathway, with all eligible banks following a standardised net income recognition approach.`

  return [openers[tier], feasibilityLine, incomeNote].filter(Boolean)
}

// ── Expert Commentary ───────────────────────────────────────────────────────

export function buildExpertCommentary(formData, profile, score) {
  const {
    eX, eXStress, dstiAtEX, varX, bottleneck, flags = [], redFlags = [],
    effectiveIncome, existingDebt, maturity,
  } = profile
  const { entityType, purchasePrice, ownFunds, applicantAge, propertyPurpose, taxRegime, businessAgeMonths, contractType } = formData

  const paragraphs = []

  // Bottleneck analysis
  if (bottleneck === 'DSTI' || bottleneck === 'DI') {
    const headroom = 45 - (dstiAtEX ?? 0)
    paragraphs.push(
      `The binding constraint on borrowing capacity is the Debt Service-to-Income ratio (DSTI), currently sitting at ${pct(dstiAtEX)} at maximum loan — ${headroom > 0 ? `${headroom.toFixed(1)} percentage points below the Czech National Bank ceiling of 45%` : 'at the regulatory ceiling'}. ` +
      `This ratio is determined by two variables: recognised income (${czk(effectiveIncome)}/month) and existing monthly obligations (${czk(existingDebt ?? 0)}/month). ` +
      `Each ${czk(5000)} reduction in monthly obligations adds approximately ${czkShort(Math.round(5000 / 0.45 * 188.64 * 0.9))} to maximum loan capacity under standard 30-year terms.`
    )
  } else if (bottleneck === 'DTI') {
    paragraphs.push(
      `The maximum loan is constrained not by monthly payment capacity but by the total Debt-to-Income multiple — the ratio of total loan amount to gross annual income. ` +
      `At ${czkShort(eX)}, this ratio sits at its regulatory ceiling. The most efficient path to expansion is increasing recognised annual income; ` +
      `each additional ${czk(10000)}/month of recognised income unlocks approximately ${czkShort(Math.round(10000 * 12 * 9.5))} of additional DTI-permitted capacity.`
    )
  } else if (bottleneck === 'LTV') {
    paragraphs.push(
      `The primary constraint is the Loan-to-Value ratio, not income capacity. ` +
      `Income is sufficient to service a larger loan; however, the purchase price and available own funds create an LTV position that reaches the regulatory maximum. ` +
      `Increasing own funds is the most direct remedy — each ${czk(100000)} additional deposit reduces the LTV by approximately ${purchasePrice > 0 ? pct(100000 / purchasePrice * 100) : 'a meaningful margin'}.`
    )
  }

  // Age and maturity
  if (applicantAge && maturity) {
    const payoffAge = Number(applicantAge) + maturity.maxYears
    paragraphs.push(
      `At ${applicantAge} years of age, the maximum loan term is ${maturity.maxYears} years, with final payment at age ${payoffAge} under the KB/standard framework. ` +
      (maturity.canExtend
        ? `The current LTV, DSTI and DTI profile qualifies for mBank's 40-year extended term option, which can materially increase maximum loan size for income-constrained profiles.`
        : `The current LTV or leverage profile does not qualify for the mBank 40-year extension (requires LTV ≤80%, DSTI ≤45%, DTI ≤8.5×).`)
    )
  }

  // Income-type specific
  if (entityType === 'osvc' && businessAgeMonths != null) {
    if (businessAgeMonths < 24) {
      paragraphs.push(
        `Business history of ${businessAgeMonths} months triggers the sub-24-month haircut applied by most Czech lenders. ` +
        `Once the 24-month threshold is crossed, the 15% income reduction is removed, adding approximately ${czkShort(Math.round(effectiveIncome * 0.15 / 0.85))} per month to the recognised income base — ` +
        `the single largest near-term capacity lever available without a change in income.`
      )
    } else {
      paragraphs.push(
        `With ${Math.floor(businessAgeMonths / 12)} years of active business history on record, the 24-month income recognition requirement is satisfied by all covered Czech lenders, ` +
        `and no age-related income haircut applies. The full ${czk(effectiveIncome)}/month recognised income is available to all assessed banks.`
      )
    }
  }

  if (entityType === 'zamestnanec' && contractType) {
    if (contractType === 'indefinite') {
      paragraphs.push(
        `The indefinite employment contract is the strongest income structure for Czech mortgage underwriting. ` +
        `All six covered banks can assess the full net salary with no haircut, and no supplementary documentation beyond standard payslips and employer confirmation is required.`
      )
    } else if (contractType === 'agency') {
      paragraphs.push(
        `Agency employment introduces a 25% income haircut across Czech banks, reducing the effective recognised income used in the DSTI calculation. ` +
        `Converting to an indefinite or fixed-term contract directly on the employer's payroll would remove this haircut and increase assessed capacity by approximately ${czkShort(Math.round(effectiveIncome / 0.75 * 0.25))}/month.`
      )
    }
  }

  // Stress test interpretation
  if (eX > 0 && eXStress > 0) {
    const stressPct = ((eX - eXStress) / eX * 100).toFixed(0)
    paragraphs.push(
      `The stress-tested loan capacity — computed at a 5.89% rate (contract rate plus 100 basis points) — is ${czkShort(eXStress)}, representing a ${stressPct}% reduction from the contractual-rate maximum. ` +
      `Czech banks use the more conservative of the two test results (DSTI at contract rate vs. DI at stressed rate) as the binding limit, which is the methodology reflected in this assessment.`
    )
  }

  // Cross-bank variance
  if (varX > 0) {
    paragraphs.push(
      `Cross-bank methodology divergence introduces a variance of ±${czkShort(varX)} around the E[X] estimate. ` +
      `This reflects genuine differences in income recognition algorithms, DSTI thresholds, and stress-test approaches across lenders. ` +
      `A structured lender comparison — the primary output of the strategy session — will identify the bank offering the best terms for this specific profile.`
    )
  }

  return paragraphs
}

// ── Recommendations ─────────────────────────────────────────────────────────

export function buildRecommendations(formData, profile, score) {
  const {
    eX, dstiAtEX, flags = [], redFlags = [], effectiveIncome, existingDebt,
    bottleneck, maturity, ltvPct, maxLTVPct,
  } = profile
  const {
    entityType, businessAgeMonths, taxRegime, contractType, applicantAge,
    purchasePrice, ownFunds, purchaseTimeline,
  } = formData

  const recs = []

  // RED FLAGS — always high impact
  if (redFlags.includes('notice_period')) {
    recs.push({
      impact: 'CRITICAL', label: 'Resolve Notice Period',
      text: 'Active employment must be confirmed at application. Secure new employment and wait for probation to end before applying. No Czech lender can proceed while notice is active.',
    })
  }
  if (redFlags.includes('probation') && entityType !== 'osvc') {
    recs.push({
      impact: 'CRITICAL', label: 'Wait for Probation Completion',
      text: 'Standard Czech lenders require the probation period to have concluded. Applying after probation ends eliminates this blocker entirely — schedule pre-approval for that date.',
    })
  }
  if (redFlags.includes('osvc_inactive_licence') || redFlags.includes('business_too_new')) {
    recs.push({
      impact: 'CRITICAL', label: 'Resolve Business Registration Status',
      text: 'An inactive or very new trade licence prevents income recognition entirely. Reactivate the licence and build 12+ months of documented business history before approaching lenders.',
    })
  }
  if (redFlags.includes('sro_negative_financials')) {
    recs.push({
      impact: 'CRITICAL', label: 'Restore Positive Company Financials',
      text: 'Negative equity or a net loss prevents ESSO income recognition. Czech banks require two consecutive years of positive after-tax result before Director income is assessable.',
    })
  }

  // DSTI-constrained: existing debt reduction
  if ((bottleneck === 'DSTI' || bottleneck === 'DI') && (existingDebt ?? 0) > 0) {
    const debtReduction = Math.min(existingDebt ?? 0, Math.round((existingDebt ?? 0) * 0.5))
    const capacityGain  = Math.round(debtReduction / 0.45 * 188.64)
    recs.push({
      impact: 'HIGH', label: 'Reduce Monthly Debt Obligations',
      text: `Your existing obligations of ${czk(existingDebt)}/month are directly compressing DSTI headroom. Eliminating ${czk(debtReduction)}/month in obligations would expand maximum loan capacity by approximately ${czkShort(capacityGain)} — the single highest-return action available today.`,
    })
  }

  // Close credit cards
  if (flags.includes('credit_card_high') || (existingDebt ?? 0) > 20_000) {
    recs.push({
      impact: 'HIGH', label: 'Close Unused Credit Card Limits',
      text: 'Czech banks count 5% of total credit card limits as a monthly obligation regardless of actual usage. Closing unused cards before application reduces assessed monthly obligations and improves DSTI directly.',
    })
  }

  // Business age
  if (entityType === 'osvc' && businessAgeMonths != null && businessAgeMonths < 24) {
    const monthsRemaining = 24 - businessAgeMonths
    recs.push({
      impact: 'HIGH', label: `Wait ${monthsRemaining} Months to Clear the 24-Month Threshold`,
      text: `After ${monthsRemaining} more months of active trading, the 15% income haircut currently applied by most Czech lenders is removed automatically. This is the highest-value time-based lever — no other action is required to unlock it.`,
    })
  }

  // LTV improvement
  if (ltvPct > 70 && (bottleneck === 'LTV' || ltvPct > maxLTVPct)) {
    const loanAmt = Math.max(0, (purchasePrice || 0) - (ownFunds || 0))
    const targetLTV = Math.min(maxLTVPct, 70)
    const targetLoan = (purchasePrice || 0) * (targetLTV / 100)
    const extraDeposit = Math.max(0, loanAmt - targetLoan)
    recs.push({
      impact: 'HIGH', label: 'Increase Own Funds to Reduce LTV',
      text: `Adding ${czkShort(extraDeposit)} to own funds would bring LTV to ${targetLTV}%, unlocking the full set of covered lenders and the most competitive rate tiers. Gift equity confirmed in writing is accepted by all Czech banks as own funds.`,
    })
  }

  // mBank 40-year extension
  if (maturity && !maturity.canExtend && Number(applicantAge || 0) < 45) {
    recs.push({
      impact: 'MEDIUM', label: 'Qualify for mBank 40-Year Term Extension',
      text: 'Bringing LTV below 80%, DSTI below 45%, and DTI below 8.5× activates the mBank 40-year term option, which increases maximum loan size without requiring higher income. This is often achievable through a modest LTV improvement.',
    })
  }

  // Income documentation for OSVČ
  if (entityType === 'osvc' && taxRegime === 'flat_tax') {
    recs.push({
      impact: 'MEDIUM', label: 'Prepare 6-Month Business Bank Statements',
      text: 'Flat-tax regime applicants are assessed on bank turnover rather than declared profit. Ensure 6 consecutive months of clean business account statements are available, showing consistent inbound business payments, before application.',
    })
  }

  // Contract conversion for employees
  if (entityType === 'zamestnanec' && contractType === 'agency') {
    recs.push({
      impact: 'MEDIUM', label: 'Convert to Direct Employment Contract',
      text: 'Moving from agency to direct employment (indefinite or fixed-term) removes the 25% income haircut and opens access to the full lender panel. Coordinate timing so the new contract is at least 2 months old at the point of application.',
    })
  }

  // Pre-approval timing
  if (purchaseTimeline === '3months') {
    recs.push({
      impact: 'MEDIUM', label: 'Initiate Bank Pre-Approval Immediately',
      text: 'With a 3-month purchase horizon, there is no time for capacity-improvement actions. Focus on securing a pre-approval letter from the bank offering the best terms for this profile — this strengthens your negotiating position with sellers.',
    })
  }

  // Bonus documentation
  if (flags.includes('bonus_income_included')) {
    recs.push({
      impact: 'LOW', label: 'Document Bonus Income History',
      text: 'Bonus income is recognised at 50% by Czech banks, but requires documented evidence of receipt for at least 2 consecutive years. Gather bonus payment records and include them in the document package.',
    })
  }

  // FX income documentation
  if (flags.includes('fx_income_included')) {
    recs.push({
      impact: 'LOW', label: 'Prepare FX Income Documentation',
      text: 'Foreign-currency income is recognised at 85% of the CZK spot rate. Bank accounts showing consistent FX inflows, employer confirmation of the salary, and evidence of regular CZK conversion will be required.',
    })
  }

  // Strategy session
  recs.push({
    impact: 'ACTION', label: 'Book a Strategy Session',
    text: 'A personalised 45-minute session will map your specific profile to the lender offering the best rate and terms, identify any remaining documentation gaps, and initiate the pre-approval process directly.',
  })

  return recs
}

// ── Scenario comparison data ─────────────────────────────────────────────────

export function buildScenarios(formData, profile) {
  const { effectiveIncome, existingDebt } = profile
  const { purchasePrice, ownFunds } = formData

  const base = { label: 'Current Profile', income: effectiveIncome, debt: existingDebt ?? 0, price: purchasePrice, own: ownFunds }

  const scenarios = [
    base,
    { label: '+10K Income',      income: effectiveIncome + 10_000,  debt: existingDebt ?? 0,  price: purchasePrice, own: ownFunds },
    { label: '+20K Income',      income: effectiveIncome + 20_000,  debt: existingDebt ?? 0,  price: purchasePrice, own: ownFunds },
    { label: '−5K Debt',         income: effectiveIncome,           debt: Math.max(0, (existingDebt ?? 0) - 5_000),  price: purchasePrice, own: ownFunds },
    { label: '−10K Debt',        income: effectiveIncome,           debt: Math.max(0, (existingDebt ?? 0) - 10_000), price: purchasePrice, own: ownFunds },
    { label: '+300K Own Funds',  income: effectiveIncome,           debt: existingDebt ?? 0,  price: purchasePrice, own: (ownFunds ?? 0) + 300_000 },
  ]

  return scenarios
}

// ── Final summary bullets ────────────────────────────────────────────────────

export function buildFinalSummary(formData, profile, score) {
  const { eX, eXStress, effectiveIncome, bottleneck, redFlags = [] } = profile
  const { entityType, purchasePrice, ownFunds } = formData

  const loanAmt = Math.max(0, (purchasePrice || 0) - (ownFunds || 0))
  const feasible = eX >= loanAmt && loanAmt > 0

  const bullets = []

  bullets.push(
    `Mortgage score: ${score}/100 — ${scoreLabel(score)}. This reflects the combined assessment of income quality, borrowing capacity, property structure, and lender eligibility.`
  )

  bullets.push(
    `Maximum assessed loan: ${czkShort(eX)} (E[X] at contract rate). Stress-tested floor: ${czkShort(eXStress)} at 5.89% p.a. The binding constraint is ${bottleneck ?? 'the DSTI ceiling'}.`
  )

  if (feasible) {
    bullets.push(
      `The target acquisition is within assessed capacity. Loan requirement of ${czkShort(loanAmt)} falls within the ${czkShort(eX)} maximum — subject to standard bank document verification and credit committee approval.`
    )
  } else if (loanAmt > 0) {
    bullets.push(
      `The target acquisition at ${czk(purchasePrice)} requires ${czkShort(loanAmt)}, which is ${czkShort(loanAmt - eX)} above current capacity. Increasing own funds, reducing debt, or adjusting the purchase price are the primary levers.`
    )
  }

  bullets.push(
    `Recognised monthly income: ${czk(effectiveIncome)} — the figure Czech banks will use in DSTI and DI calculations after all applicable haircuts and methodology adjustments.`
  )

  if (redFlags.length === 0) {
    bullets.push('No hard-block risk flags are present. The application is eligible for submission via standard underwriting pathways at the lender selected through the strategy session.')
  } else {
    bullets.push(`${redFlags.length} hard-block flag(s) require resolution before standard mortgage submission. Refer to the Constraint Analysis section for specific remediation steps.`)
  }

  return bullets
}
