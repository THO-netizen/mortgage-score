import React from 'react'
import {
  Document, Page, View, Text, Link, Svg, Circle,
  StyleSheet,
} from '@react-pdf/renderer'
import { computeScore, computeMortgageProfile, monthlyPayment } from '../utils/scoringEngine.js'

/* ── ASCII bank names ─────────────────────────────── */
const BNAMES = {
  mbank: 'mBank', kb: 'KB', csob: 'CSOB',
  cs: 'Ceska sporitelna', rb: 'Raiffeisenbank', ucb: 'UniCredit',
}
const BKEYS = ['mbank', 'kb', 'csob', 'cs', 'rb', 'ucb']

/* ── Palette ─────────────────────────────────────── */
const N   = '#0F172A'   // dark hero bg
const NM  = '#1E293B'   // table header bg
const GL  = '#B8973A'   // gold accent
const SF  = '#FAF9F6'   // warm off-white page bg
const WH  = '#FFFFFF'
const BD  = '#E8E0D0'   // warm border
const IN  = '#1E293B'   // dark ink
const MU  = '#6B6252'   // warm muted
const SU  = '#9B8E7E'   // warm light muted
const OK  = '#10B981'
const WA  = '#F59E0B'
const RK  = '#EF4444'
const BR  = '#2563EB'   // CTA blue

const scCol = s => s >= 75 ? OK : s >= 55 ? BR : s >= 35 ? WA : RK
const scLab = s => s >= 75 ? 'Strong Applicant' : s >= 55 ? 'Good Standing' : s >= 35 ? 'Needs Review' : 'High Risk'
function heroMsg(s, name) {
  const p = s >= 75 ? "You're in a strong position"
    : s >= 55 ? "Your profile is well-positioned"
    : s >= 35 ? "Your profile shows clear potential"
    : "Your profile requires preparation"
  const n = name && name.trim() ? `, ${name.trim()}` : ''
  return `${p}${n}.`
}

function czkS(n) {
  if (!n || n <= 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M CZK'
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'k CZK'
  return n.toFixed(0) + ' CZK'
}
function pctF(n) { return n != null ? n.toFixed(1) + '%' : '—' }
function tr(s, n) { if (!s) return '—'; return s.length > n ? s.slice(0, n - 1) + '…' : s }

/* ── Page geometry ───────────────────────────────── */
const PM = 36

/* ── StyleSheet ──────────────────────────────────── */
const S = StyleSheet.create({
  page: {
    width: 595, height: 842,
    padding: PM,
    paddingBottom: PM + 28,
    backgroundColor: SF,
    fontFamily: 'Helvetica',
  },

  /* Header */
  hdr: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 9, marginBottom: 11,
    borderBottomWidth: 1, borderBottomColor: BD,
  },
  hdrBrand: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: N },
  hdrSub:   { fontSize: 6.5, color: MU, marginTop: 1 },
  hdrRight: { alignItems: 'flex-end' },
  hdrLabel: { fontSize: 7, color: SU },
  hdrPage:  { fontSize: 6.5, color: SU, marginTop: 2 },

  /* Footer */
  footer: {
    position: 'absolute', bottom: PM, left: PM, right: PM,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: BD, paddingTop: 5,
  },
  footTxt: { fontSize: 6, color: SU },

  /* Hero */
  hero: {
    backgroundColor: N, borderRadius: 4, padding: 16,
    marginBottom: 10, overflow: 'hidden',
  },
  heroRow:  { flexDirection: 'row' },
  heroDiv:  { width: 1, backgroundColor: '#334155', marginHorizontal: 14, alignSelf: 'stretch' },
  heroLbl:  { fontSize: 6.5, color: SU, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 },
  heroNum:  { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WH },
  heroSub:  { fontSize: 7.5, color: SU, marginTop: 3 },

  /* Section title — gold */
  secTitle: {
    fontSize: 7, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.8,
    color: GL, marginBottom: 7,
  },

  /* Card */
  card: {
    backgroundColor: WH, borderRadius: 4,
    borderWidth: 1, borderColor: BD,
    padding: 10, overflow: 'hidden',
  },

  /* Profile mini-card */
  pCard: {
    flex: 1, backgroundColor: WH,
    borderRadius: 4, borderWidth: 1, borderColor: BD,
    padding: 8, overflow: 'hidden',
  },
  pLbl: { fontSize: 6, textTransform: 'uppercase', letterSpacing: 0.5, color: SU, marginBottom: 3 },
  pVal: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: IN },
  pSub: { fontSize: 6, color: MU, marginTop: 2 },

  /* Bar */
  barRow:    { marginBottom: 9 },
  barTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 3 },
  barLbl:    { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN },
  barSub:    { fontSize: 6, color: MU, marginTop: 1 },
  barBg:     { height: 5, backgroundColor: BD, borderRadius: 3, overflow: 'hidden' },
  barFill:   { height: 5, borderRadius: 3 },
  barVal:    { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  barLim:    { fontSize: 6.5, color: SU },

  /* Table */
  tHdr:  { flexDirection: 'row', backgroundColor: NM, paddingVertical: 5, paddingHorizontal: 6 },
  tRow:  { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: BD },
  tHCel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: SU, textTransform: 'uppercase' },
  tCel:  { fontSize: 7.5, color: IN, overflow: 'hidden' },
  tMut:  { fontSize: 7.5, color: MU },

  /* Strategy */
  sNum:   { width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: IN, flex: 1 },
  sBadge: { fontSize: 6, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3 },
  sBody:  { fontSize: 7.5, color: MU, lineHeight: 1.45, marginTop: 2 },

  /* CTA */
  cta:      { backgroundColor: N, borderRadius: 4, padding: 18, alignItems: 'center', overflow: 'hidden' },
  ctaTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: WH, textAlign: 'center', marginBottom: 7 },
  ctaBody:  { fontSize: 8, color: SU, textAlign: 'center', lineHeight: 1.5, marginBottom: 14, maxWidth: 360 },
  ctaBtn:   { backgroundColor: BR, borderRadius: 4, paddingVertical: 9, paddingHorizontal: 24 },
  ctaBtnTx: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: WH },
  ctaSub:   { fontSize: 7, color: MU, marginTop: 8, textAlign: 'center' },

  /* Metric chip */
  chip:    { flex: 1, backgroundColor: WH, borderRadius: 4, borderWidth: 1, borderColor: BD, padding: 8, overflow: 'hidden' },
  chipLbl: { fontSize: 6, textTransform: 'uppercase', letterSpacing: 0.5, color: SU, marginBottom: 3 },
  chipVal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: IN },
})

/* ── Shared sub-components ───────────────────────── */

function Hdr({ label, n, total }) {
  return (
    <View style={S.hdr} fixed>
      <View>
        <Text style={S.hdrBrand}>Mortgage Score</Text>
        <Text style={S.hdrSub}>Confidential · Personalised Assessment</Text>
      </View>
      <View style={S.hdrRight}>
        <Text style={S.hdrLabel}>{label}</Text>
        <Text style={S.hdrPage}>Page {n} of {total}</Text>
      </View>
    </View>
  )
}

function Ftr({ today }) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footTxt}>MortgageScore.cz · {today}</Text>
      <Text style={S.footTxt}>Indicative only — not financial advice</Text>
    </View>
  )
}

/* Circular score gauge — SVG ring + absolute text overlay */
function ScoreGauge({ score, color }) {
  const R   = 34
  const C   = 2 * Math.PI * R
  const dash = (score / 100) * C
  return (
    <View style={{ width: 80, height: 80 }}>
      <Svg width="80" height="80" viewBox="0 0 80 80">
        {/* Track */}
        <Circle cx="40" cy="40" r={R} fill="none" stroke="#334155" strokeWidth="8" />
        {/* Progress arc — rotated to start at 12 o'clock */}
        <Circle
          cx="40" cy="40" r={R} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${C}`}
          transform="rotate(-90 40 40)"
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 19, fontFamily: 'Helvetica-Bold', color: WH, lineHeight: 1 }}>{score}</Text>
        <Text style={{ fontSize: 6.5, color: SU, marginTop: 1 }}>/100</Text>
      </View>
    </View>
  )
}

function Bar({ label, sub, value, limit, color }) {
  const fill = Math.min(100, limit > 0 ? (value / limit) * 100 : 0)
  return (
    <View style={S.barRow}>
      <View style={S.barTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={S.barLbl}>{label}</Text>
          <Text style={S.barSub}>{sub}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[S.barVal, { color }]}>{pctF(value)}</Text>
          <Text style={S.barLim}>limit {limit.toFixed(0)}%</Text>
        </View>
      </View>
      <View style={S.barBg}>
        <View style={[S.barFill, { backgroundColor: color, width: `${fill}%` }]} />
      </View>
    </View>
  )
}

function StratItem({ n, priority, color, title, text }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 9 }}>
      <View style={[S.sNum, { backgroundColor: color, marginRight: 8 }]}>
        <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: WH }}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={[S.sTitle, { marginRight: 5 }]}>{tr(title, 55)}</Text>
          <View style={[S.sBadge, { backgroundColor: color + '22', borderWidth: 0.5, borderColor: color + '55' }]}>
            <Text style={[S.sBadge, { color, padding: 0, paddingHorizontal: 0, paddingVertical: 0 }]}>{priority}</Text>
          </View>
        </View>
        <Text style={S.sBody}>{text}</Text>
      </View>
    </View>
  )
}

/* ── Lender Fit — 3 category cards (no bank names) ─ */

function LenderFitSection({ bankResults }) {
  const sorted = BKEYS
    .filter(k => (bankResults?.[k]?.maxLoan || 0) > 0)
    .sort((a, b) => (bankResults[b].maxLoan || 0) - (bankResults[a].maxLoan || 0))

  const tiers = [
    { label: 'High Flexibility',  desc: 'Method B friendly / high DSTI tolerance', color: OK, keys: sorted.slice(0, 2) },
    { label: 'Mainstream',        desc: 'Standard underwriting methodology',        color: BR, keys: sorted.slice(2, 4) },
    { label: 'Conservative',      desc: 'DPFO-primary / tighter DSTI limits',      color: MU, keys: sorted.slice(4) },
  ]

  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={S.secTitle}>Lender Fit — Capacity by Category</Text>
      <View style={{ flexDirection: 'row' }}>
        {tiers.map((tier, i) => {
          const best = tier.keys.reduce((m, k) => Math.max(m, bankResults?.[k]?.maxLoan || 0), 0)
          return (
            <View key={i} style={[S.card, { flex: 1, marginRight: i < 2 ? 6 : 0 }]}>
              <View style={{ height: 2.5, backgroundColor: tier.color, borderRadius: 2, marginBottom: 8 }} />
              <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN, marginBottom: 4 }}>{tier.label}</Text>
              <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: IN, marginBottom: 3 }}>{czkS(best)}</Text>
              <Text style={{ fontSize: 6, color: MU, marginBottom: 4 }}>{tier.keys.length} lender{tier.keys.length !== 1 ? 's' : ''} in category</Text>
              <Text style={{ fontSize: 6, color: SU, lineHeight: 1.35 }}>{tier.desc}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

/* ── Binding Constraint Summary (text card) ─────── */

function BindingConstraintSummary({ profile }) {
  const { bottleneck, dstiAtEX, ltvPct, maxLTVPct, eX } = profile
  const explanation = bottleneck === 'DSTI'
    ? `DSTI is the binding constraint at ${pctF(dstiAtEX)}. Reducing monthly obligations or selecting a lender with a higher DSTI cap directly increases available capacity.`
    : bottleneck === 'LTV'
    ? `LTV is the binding constraint at ${ltvPct.toFixed(0)}% against a ${maxLTVPct}% cap. Increasing own funds by as little as 5% directly unlocks additional borrowing capacity.`
    : bottleneck === 'DTI'
    ? 'Total debt-to-income ratio is the binding constraint. Reducing outstanding loan balances or increasing the annual income base are the highest-return actions available before application.'
    : `Your profile is within all primary limits. The estimated maximum loan of ${czkS(eX)} is set by the combination of income capacity and your selected bank's DSTI ceiling.`

  const accentColor = bottleneck === 'LTV' ? RK : bottleneck ? WA : OK

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={S.secTitle}>Binding Constraint Analysis</Text>
      <View style={[S.card, { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ width: 3, backgroundColor: accentColor, alignSelf: 'stretch', borderRadius: 2, marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN, marginBottom: 3 }}>
            {bottleneck ? `Binding Constraint: ${bottleneck}` : 'All Constraints: Within Limits'}
          </Text>
          <Text style={{ fontSize: 7, color: MU, lineHeight: 1.4 }}>{explanation}</Text>
        </View>
      </View>
    </View>
  )
}

/* ── Cost of Waiting ──────────────────────────────── */

function CostOfWaiting({ profile }) {
  const { eX, maturity } = profile
  if (!eX || eX <= 0) return null
  const years = maturity?.maxYears ?? 30
  const payNow    = monthlyPayment(eX, 4.89, years)
  const payPlus1  = monthlyPayment(eX, 5.89, years)
  const extraMo   = payPlus1 - payNow
  const extraTot  = extraMo * years * 12

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={S.secTitle}>The Cost of Waiting</Text>
      <View style={[S.card, { flexDirection: 'row' }]}>
        <View style={{ flex: 1, paddingRight: 10, marginRight: 10, borderRightWidth: 1, borderRightColor: BD }}>
          <Text style={{ fontSize: 6.5, color: MU, marginBottom: 3 }}>If rates rise 1% before application</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: RK }}>+{czkS(extraMo)}/mo</Text>
          <Text style={{ fontSize: 6, color: SU, marginTop: 2 }}>extra monthly repayment</Text>
        </View>
        <View style={{ flex: 1, paddingRight: 10, marginRight: 10, borderRightWidth: 1, borderRightColor: BD }}>
          <Text style={{ fontSize: 6.5, color: MU, marginBottom: 3 }}>Total extra interest over {years} yrs</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: WA }}>{czkS(extraTot)}</Text>
          <Text style={{ fontSize: 6, color: SU, marginTop: 2 }}>if delayed by one rate cycle</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 6.5, color: MU, marginBottom: 3 }}>Optimal action</Text>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: OK, lineHeight: 1.3 }}>
            Lock in current assessment and initiate pre-approval now.
          </Text>
        </View>
      </View>
    </View>
  )
}

/* ── Underwriter's Perspective ───────────────────── */

function UnderwriterPerspective({ profile, formData }) {
  const { dstiAtEX, ltvPct, maxLTVPct, effectiveIncome, existingDebt, eX, maturity } = profile
  const years   = maturity?.maxYears ?? 30
  const mp      = eX > 0 ? monthlyPayment(eX, 4.89, years) : 0
  const surplus = Math.max(0, (effectiveIncome || 0) - mp - (existingDebt || 0) - 4_860)

  const dstiText = dstiAtEX > 40
    ? `At ${pctF(dstiAtEX)} DSTI, estimated post-obligation surplus is ~${czkS(surplus)}/mo. Czech banks flag profiles where surplus falls below 20% of net income — your file is ${dstiAtEX > 44 ? 'above' : 'near'} that threshold.`
    : `Your ${pctF(dstiAtEX)} DSTI leaves an estimated surplus of ~${czkS(surplus)}/mo after all obligations. This signals strong repayment capacity and reduces the file's risk classification at credit committee.`

  let secondTitle, secondText
  if (ltvPct > 75) {
    const pp = Number(formData.purchasePrice) || 0
    const of = Number(formData.ownFunds) || 0
    const rv = pp > 0 ? ((pp - of) / (pp * 0.90) * 100) : ltvPct * 1.11
    secondTitle = 'Collateral Valuation Risk'
    secondText  = `At ${pctF(ltvPct)} LTV, a 10% downward revaluation by the bank's appraiser would push effective LTV to ~${rv.toFixed(0)}%, close to the ${maxLTVPct}% cap. A modest increase in own funds builds resilience against this scenario.`
  } else if (formData.entityType === 'osvc') {
    secondTitle = 'Self-Employed Income Scrutiny'
    secondText  = 'Underwriters cross-check declared tax-base income against bank statement turnover. Material divergence triggers additional questions — having a margin explanation prepared minimises processing delays.'
  } else if (formData.entityType === 'sro') {
    secondTitle = 'Company Director Income Complexity'
    secondText  = 'ESSO methodology reconstructs income from 2 years of company financials and personal returns. Consistent, complete documentation across both years is the single largest factor in underwriting speed.'
  } else {
    const ct = formData.contractType
    secondTitle = 'Employment Contract Assessment'
    secondText  = ct === 'indefinite'
      ? 'Indefinite contracts receive full income recognition — the strongest employment basis for Czech mortgage underwriting. The underwriter verifies net pay against the employer confirmation letter.'
      : 'Fixed-term or non-standard contracts receive an income haircut at most Czech banks. The underwriter verifies contract end date and continuity of employment history.'
  }

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={S.secTitle}>{"The Underwriter's Perspective"}</Text>
      <View style={S.card}>
        <View style={{ marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BD }}>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN, marginBottom: 3 }}>Monthly Surplus & Repayment Capacity</Text>
          <Text style={{ fontSize: 7, color: MU, lineHeight: 1.4 }}>{dstiText}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN, marginBottom: 3 }}>{secondTitle}</Text>
          <Text style={{ fontSize: 7, color: MU, lineHeight: 1.4 }}>{secondText}</Text>
        </View>
      </View>
    </View>
  )
}

/* ── Scenario Optimisation ───────────────────────── */

function ScenarioOptimization({ formData, profile }) {
  const base = profile.eX || 0
  function safeCompute(fd) {
    try { return computeMortgageProfile(fd).eX || base } catch { return base }
  }
  const s1 = safeCompute({ ...formData, ownFunds: (Number(formData.ownFunds) || 0) + 500_000 })
  const s2 = safeCompute({ ...formData, monthlyLoanPayments: Math.max(0, (Number(formData.monthlyLoanPayments) || 0) - 2_000) })
  const s3 = safeCompute({ ...formData, netIncome: Math.round((Number(formData.netIncome) || profile.effectiveIncome || 0) * 1.10) })

  const rows = [
    { action: 'Add 500k CZK to down-payment',      newEX: s1, delta: s1 - base },
    { action: 'Reduce monthly debt load by 2k/mo', newEX: s2, delta: s2 - base },
    { action: 'Increase recognised income by 10%', newEX: s3, delta: s3 - base },
  ]

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={S.secTitle}>Scenario Optimisation</Text>
      <View style={{ borderWidth: 1, borderColor: BD, borderRadius: 4, overflow: 'hidden' }}>
        <View style={S.tHdr}>
          <Text style={[S.tHCel, { flex: 3 }]}>If you...</Text>
          <Text style={[S.tHCel, { flex: 2, textAlign: 'right' }]}>New Max Loan</Text>
          <Text style={[S.tHCel, { flex: 2, textAlign: 'right' }]}>vs Baseline</Text>
        </View>
        {rows.map((r, i) => (
          <View key={i} style={[S.tRow, i === 2 && { borderBottomWidth: 0 }, i % 2 === 1 && { backgroundColor: SF }]}>
            <Text style={[S.tCel, { flex: 3 }]}>{r.action}</Text>
            <Text style={[S.tCel, { flex: 2, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{czkS(r.newEX)}</Text>
            <Text style={[S.tCel, { flex: 2, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: r.delta >= 0 ? OK : RK }]}>
              {r.delta >= 0 ? '+' : ''}{czkS(Math.abs(r.delta))}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[S.footTxt, { marginTop: 4 }]}>
        {'Baseline: ' + czkS(base) + '. Scenarios use Czech dual-test at 4.89% / 6.89%.'}
      </Text>
    </View>
  )
}

/* ── Pre-Approval Checklist ──────────────────────── */

function PreApprovalChecklist({ formData }) {
  const { entityType, contractType } = formData
  const incomeDocs = entityType === 'osvc' ? [
    'Last 2 completed tax returns (DPFO) with tax office stamp',
    'Last 3 months bank statements — all business and personal accounts',
    'Business registration extract (Zivnostensky rejstrik, max 3 months)',
    'VAT returns — last 4 quarters (if VAT-registered)',
  ] : entityType === 'sro' ? [
    'Last 2 years company financial statements (rozvaha + VZZ)',
    'Last 2 years personal tax returns (DPFO)',
    'Company extract from Commercial Register (max 3 months)',
    'UBO declaration and director employment or service contract',
  ] : [
    'Last 3 months payslips from all employers',
    'Employer salary confirmation (potvrzeni zamestnavatele)',
    contractType === 'indefinite' ? 'Indefinite employment contract — full copy' : 'Employment contract with confirmed end date',
    'Last 3 months bank statements (salary account)',
  ]
  const propertyDocs = [
    'Preliminary purchase agreement or signed letter of intent',
    'Current title deed extract (list vlastnictvi, max 3 months)',
  ]
  const allDocs = [...incomeDocs, ...propertyDocs]
  const entityMap = { osvc: 'Self-Employed (OSVC)', sro: 's.r.o. Director', zamestnanec: 'Salaried Employee' }

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={S.secTitle}>Pre-Approval Document Checklist</Text>
      <View style={S.card}>
        <Text style={{ fontSize: 6.5, color: MU, marginBottom: 6 }}>
          {'Profile: ' + (entityMap[entityType] ?? 'Standard') + '. Prepare these before your strategy session.'}
        </Text>
        {allDocs.map((doc, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: i < allDocs.length - 1 ? 4 : 0 }}>
            <View style={{ width: 7, height: 7, borderWidth: 1, borderColor: BD, borderRadius: 1, marginRight: 6, marginTop: 1 }} />
            <Text style={{ fontSize: 7, color: IN, flex: 1, lineHeight: 1.35 }}>{doc}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

/* ── PAGE 1 — Hero Verdict & Capacity ────────────── */

function Page1({ ctx }) {
  const { formData, profile, score, today } = ctx
  const {
    eX, eXStress, dstiAtEX, ltvPct, maxLTVPct,
    bottleneck, winnerBank, bankResults, maturity,
    existingDebt, effectiveIncome, riskStatus,
  } = profile

  const scColor  = scCol(score)
  const riskBand = { zelena: 'Low Risk', oranzova: 'Moderate Risk', cervena: 'Higher Risk' }[riskStatus] ?? 'Under Assessment'

  const winnerR   = bankResults?.[winnerBank]
  const dstiLim   = winnerR ? winnerR.effectiveDSTI * 100 : 45
  const stressPay = eX > 0 && maturity?.maxYears > 0 ? monthlyPayment(eX, 6.89, maturity.maxYears) : 0
  const stressDST = effectiveIncome > 0 ? Math.min(99, ((stressPay + existingDebt) / effectiveIncome) * 100) : 0

  const bars = [
    { label: 'Debt Service (DSTI)', sub: 'at 4.89% fixation rate', value: dstiAtEX,  limit: dstiLim,   binding: bottleneck === 'DSTI' },
    { label: 'Stress Test (DI)',    sub: 'at 6.89% stress rate',   value: stressDST, limit: 45,         binding: bottleneck !== 'DSTI' && bottleneck !== 'LTV' },
    { label: 'LTV (Loan-to-Value)', sub: 'against collateral cap', value: ltvPct,    limit: maxLTVPct,  binding: bottleneck === 'LTV' },
  ]

  const residLbl = {
    eu: 'EU Citizen', permanent: 'Permanent Res.',
    longterm5plus: 'Long-term 5+ yr', longterm: 'Long-term Res.',
    employment: 'Work / Business', other: 'Other',
  }[formData.residenceStatus] ?? '—'

  const entityLbl  = { zamestnanec: 'Salaried', osvc: 'Self-Employed', sro: 's.r.o. Director' }[formData.entityType] ?? '—'
  const own        = formData.purchasePrice > 0 ? ((formData.ownFunds / formData.purchasePrice) * 100).toFixed(0) + '%' : '—'
  const yrsLbl     = { less1: '<1 yr', '1-2': '1-2 yr', '2-5': '2-5 yr', '5-10': '5-10 yr', '10plus': '10+ yr' }[formData.yearsInCZ] ?? ''
  const displayName = tr(formData.leadName || '', 22)

  return (
    <Page size="A4" style={S.page}>
      <Hdr label="Executive Summary" n={1} total={3} />

      {/* Hero — dark section with score gauge + loan data */}
      <View style={S.hero}>
        {/* Gold accent line at top */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, backgroundColor: GL }} />
        <View style={S.heroRow}>

          {/* Left — Score gauge + hero sentence */}
          <View style={{ width: 130 }}>
            <ScoreGauge score={score} color={scColor} />
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: scColor, marginTop: 6 }}>{scLab(score)}</Text>
            <Text style={{ fontSize: 7.5, color: WH, lineHeight: 1.4, marginTop: 6 }}>{heroMsg(score, displayName)}</Text>
          </View>

          <View style={S.heroDiv} />

          {/* Middle — Max Loan + Stress Floor */}
          <View style={{ flex: 1 }}>
            <View style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
              <Text style={S.heroLbl}>Estimated Maximum Loan</Text>
              <Text style={S.heroNum}>{czkS(eX)}</Text>
              <Text style={S.heroSub}>Based on {czkS(effectiveIncome)}/mo recognised income</Text>
            </View>
            <View>
              <Text style={S.heroLbl}>Stress-Tested Safe Floor · 6.89%</Text>
              <Text style={[S.heroNum, { fontSize: 16, color: SU }]}>{czkS(eXStress)}</Text>
              <Text style={S.heroSub}>Calculated at CNB stress rate</Text>
            </View>
          </View>

          <View style={S.heroDiv} />

          {/* Right — Risk band + constraint */}
          <View style={{ width: 100 }}>
            <Text style={S.heroLbl}>Risk Band</Text>
            <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: WH, marginBottom: 12 }}>{riskBand}</Text>
            <Text style={S.heroLbl}>Binding Constraint</Text>
            <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: WA }}>{bottleneck ?? 'Within Limits'}</Text>
          </View>

        </View>
      </View>

      {/* Two columns: Constraint Bars | Profile Snapshot */}
      <View style={{ flexDirection: 'row' }}>

        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={S.secTitle}>Binding Constraint Bars</Text>
          <View style={S.card}>
            {bars.map(b => {
              const color = b.value > b.limit ? RK : b.binding ? WA : OK
              return <Bar key={b.label} {...b} color={color} />
            })}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={S.secTitle}>Profile Snapshot</Text>
          <View style={{ flexDirection: 'row', marginBottom: 5 }}>
            <View style={[S.pCard, { marginRight: 5 }]}>
              <Text style={S.pLbl}>Residence</Text>
              <Text style={S.pVal}>{tr(residLbl, 20)}</Text>
              <Text style={S.pSub}>{yrsLbl} in Czech Republic</Text>
            </View>
            <View style={S.pCard}>
              <Text style={S.pLbl}>Income Type</Text>
              <Text style={S.pVal}>{entityLbl}</Text>
              <Text style={S.pSub}>
                {formData.entityType === 'osvc'
                  ? tr(formData.naceSector || 'Sector —', 20)
                  : formData.entityType === 'zamestnanec'
                    ? ({ indefinite: 'Indefinite', definite: 'Fixed-term', agency: 'Agency', dpc: 'DPC' }[formData.contractType] ?? '—')
                    : '—'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={[S.pCard, { marginRight: 5 }]}>
              <Text style={S.pLbl}>Recognised Income</Text>
              <Text style={S.pVal}>{effectiveIncome > 0 ? czkS(effectiveIncome) + '/mo' : '—'}</Text>
              <Text style={S.pSub}>{formData.entityType === 'osvc' ? 'Turnover-based' : formData.entityType === 'zamestnanec' ? 'Net salary' : 'ESSO assessed'}</Text>
            </View>
            <View style={S.pCard}>
              <Text style={S.pLbl}>Property</Text>
              <Text style={S.pVal}>{czkS(formData.purchasePrice)}</Text>
              <Text style={S.pSub}>{own} own funds · LTV {ltvPct.toFixed(0)}%</Text>
            </View>
          </View>
        </View>

      </View>

      {/* Underwriter's Perspective */}
      <UnderwriterPerspective profile={profile} formData={formData} />

      <Ftr today={today} />
    </Page>
  )
}

/* ── PAGE 2 — Income & Bank Capacity ─────────────── */

function Page2({ ctx }) {
  const { formData, profile, today } = ctx
  const { effectiveIncome, flags, bankResults, winnerBank, dstiAtEX } = profile

  const isOsvc = formData.entityType === 'osvc'
  const coeff  = (formData.turnoverIncomePct ?? 70) / 100
  const cLabel = `${formData.turnoverIncomePct ?? 70}%`
  const annNum = Number(formData.annualTurnover ?? 0)
  const monNum = Number(formData.avgMonthlyCreditTurnover ?? 0)
  const mA     = annNum > 0 ? Math.min(Math.round(annNum / 12 * coeff), 150_000) : null
  const mB     = monNum > 0 ? Math.min(Math.round(monNum * coeff), 150_000) : null
  const active = flags.includes('flat_tax_method') ? 'B' : 'A'

  return (
    <Page size="A4" style={S.page}>
      <Hdr label="Income & Bank Capacity" n={2} total={3} />

      {/* Income Recognition */}
      {isOsvc ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={S.secTitle}>Income Recognition — Method Comparison</Text>
          <View style={{ flexDirection: 'row' }}>

            {/* Method A */}
            <View style={[S.card, { flex: 1, marginRight: 6, borderColor: active === 'A' ? GL : BD, borderWidth: active === 'A' ? 1.5 : 1 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN }}>Method A — Tax Return</Text>
                {active === 'A' && (
                  <View style={{ backgroundColor: GL, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 }}>
                    <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: WH }}>APPLIED</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 6.5, color: MU, marginBottom: 6 }}>Annual turnover / 12 × {cLabel} recognition</Text>
              {mA !== null ? (
                <View>
                  <Text style={{ fontSize: 6.5, color: MU }}>Recognised income</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: IN }}>{czkS(mA)}/mo</Text>
                  {annNum > 0 && <Text style={{ fontSize: 6, color: SU, marginTop: 2 }}>Annual basis: {czkS(annNum)}/yr</Text>}
                </View>
              ) : <Text style={{ fontSize: 6.5, color: SU }}>Annual turnover not entered</Text>}
            </View>

            {/* Method B */}
            <View style={[S.card, { flex: 1, marginRight: 6, borderColor: active === 'B' ? GL : BD, borderWidth: active === 'B' ? 1.5 : 1 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN }}>Method B — Bank Turnover</Text>
                {active === 'B' && (
                  <View style={{ backgroundColor: GL, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 }}>
                    <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: WH }}>APPLIED</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 6.5, color: MU, marginBottom: 6 }}>Avg monthly credit turnover × {cLabel}</Text>
              {mB !== null ? (
                <View>
                  <Text style={{ fontSize: 6.5, color: MU }}>Recognised income</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: IN }}>{czkS(mB)}/mo</Text>
                  <Text style={{ fontSize: 6, color: SU, marginTop: 2 }}>Monthly basis: {czkS(monNum)}/mo</Text>
                </View>
              ) : <Text style={{ fontSize: 6.5, color: SU }}>Monthly turnover not entered</Text>}
            </View>

            {/* Applied total */}
            <View style={[S.card, { width: 100, backgroundColor: SF }]}>
              <Text style={{ fontSize: 6.5, color: MU, marginBottom: 3 }}>Applied Method</Text>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: GL, marginBottom: 8 }}>Method {active}</Text>
              <Text style={{ fontSize: 6.5, color: MU }}>Recognised</Text>
              <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: IN }}>{czkS(effectiveIncome)}/mo</Text>
              <Text style={{ fontSize: 6, color: SU, marginTop: 3 }}>Cap: 150k CZK/mo</Text>
            </View>

          </View>
        </View>
      ) : (
        <View style={{ marginBottom: 10 }}>
          <Text style={S.secTitle}>Income Assessment</Text>
          <View style={[S.card, { flexDirection: 'row' }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 6.5, color: MU }}>Recognised Monthly Income</Text>
              <Text style={{ fontSize: 17, fontFamily: 'Helvetica-Bold', color: IN }}>{czkS(effectiveIncome)}/mo</Text>
              <Text style={{ fontSize: 6.5, color: SU, marginTop: 3 }}>
                {formData.entityType === 'zamestnanec' ? 'Net salary — Czech bank methodology' : 'ESSO-assessed director income'}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: BD, marginHorizontal: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 6.5, color: MU }}>Debt Service Ratio (DSTI)</Text>
              <Text style={{ fontSize: 17, fontFamily: 'Helvetica-Bold', color: IN }}>{pctF(dstiAtEX)}</Text>
              <Text style={{ fontSize: 6.5, color: SU, marginTop: 3 }}>CNB 45% ceiling</Text>
            </View>
          </View>
        </View>
      )}

      {/* Lender Fit — 3 category cards */}
      <LenderFitSection bankResults={bankResults} />

      {/* Scenario Optimisation */}
      <ScenarioOptimization formData={formData} profile={profile} />

      {/* Pre-Approval Checklist */}
      <PreApprovalChecklist formData={formData} />

      {/* Binding Constraint Summary */}
      <BindingConstraintSummary profile={profile} />

      <Ftr today={today} />
    </Page>
  )
}

/* ── PAGE 3 — Strategy & Next Steps ──────────────── */

function Page3({ ctx }) {
  const { formData, profile, score, today } = ctx
  const { bottleneck, redFlags, ltvPct, maxLTVPct, eX, eXStress, dstiAtEX } = profile

  const actions = []

  if (redFlags.length > 0) {
    actions.push({
      priority: 'Critical', color: RK,
      title: 'Resolve Hard Blocks Before Applying',
      text: `Your profile has ${redFlags.length} critical flag${redFlags.length > 1 ? 's' : ''} that will trigger automatic decline at most banks. These must be resolved before any formal application.`,
    })
  }

  if (bottleneck === 'LTV' || ltvPct > maxLTVPct * 0.92) {
    actions.push({
      priority: 'High Impact', color: WA,
      title: 'Increase Down-Payment',
      text: `LTV is the binding constraint at ${ltvPct.toFixed(0)}% against a ${maxLTVPct}% cap. Increasing own funds by 5-10% directly expands borrowing capacity and improves rate pricing tiers.`,
    })
  } else if (bottleneck === 'DSTI' || bottleneck === 'DI') {
    actions.push({
      priority: 'High Impact', color: WA,
      title: 'Reduce Monthly Obligation Load',
      text: 'Debt service ratio is the binding constraint. Closing credit card limits and paying down revolving credit before application directly increases available DSTI headroom.',
    })
  } else if (bottleneck === 'DTI') {
    actions.push({
      priority: 'High Impact', color: WA,
      title: 'Reduce Outstanding Debt Balance',
      text: 'Total debt-to-income ratio is the cap. Reducing outstanding loan balances or increasing the annual income base are the highest-return actions before application.',
    })
  }

  if (formData.entityType === 'osvc') {
    actions.push({
      priority: 'Strategy', color: GL,
      title: 'Select the Right Income Recognition Method',
      text: 'Tax Return vs. Bank Turnover methodology yields materially different recognised income at different lenders. The method selection determines which bank to approach first.',
    })
  }

  if (formData.entityType === 'osvc' && formData.businessAgeMonths != null && formData.businessAgeMonths < 24) {
    actions.push({
      priority: formData.businessAgeMonths < 12 ? 'Critical' : 'High Impact',
      color: formData.businessAgeMonths < 12 ? RK : WA,
      title: formData.businessAgeMonths < 12 ? 'Establish 12-Month Trading History' : 'Reach 24-Month Threshold',
      text: formData.businessAgeMonths < 12
        ? 'Under 12 months of trading history will result in decline at most Czech banks. A continuity path from prior employment in the same sector may be the fastest qualifying route.'
        : `At ${formData.businessAgeMonths} months, a 15% income haircut applies. Crossing 24 months removes this haircut and unlocks full recognition at most Czech banks.`,
    })
  }

  actions.push({
    priority: score >= 75 ? 'Next Step' : 'Recommended', color: OK,
    title: 'Book a Strategy Session',
    text: score >= 75
      ? 'Profile is submission-ready. A 30-min session identifies the optimal lender, locks in the best rate, and initiates pre-approval within 2-3 weeks.'
      : 'A strategy session maps your lender options, confirms the income path that works in your favour, and sets a clear improvement timeline.',
  })

  return (
    <Page size="A4" style={S.page}>
      <Hdr label="Strategy & Next Steps" n={3} total={3} />

      {/* Key metrics chips */}
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        {[
          { lbl: 'Max Loan',           val: czkS(eX) },
          { lbl: 'Stress Floor 6.89%', val: czkS(eXStress) },
          { lbl: 'Debt Service Ratio', val: pctF(dstiAtEX) },
          { lbl: 'Readiness Score',    val: `${score} / 100` },
        ].map(({ lbl, val }, i) => (
          <View key={lbl} style={[S.chip, i < 3 && { marginRight: 6 }]}>
            <Text style={S.chipLbl}>{lbl}</Text>
            <Text style={S.chipVal}>{val}</Text>
          </View>
        ))}
      </View>

      {/* Your Action Plan */}
      <Text style={S.secTitle}>Your Action Plan</Text>
      <View style={{ marginBottom: 10 }}>
        {actions.slice(0, 4).map((a, i) => (
          <StratItem key={i} n={i + 1} priority={a.priority} color={a.color} title={a.title} text={a.text} />
        ))}
      </View>

      {/* Cost of Waiting */}
      <CostOfWaiting profile={profile} />

      {/* CTA block */}
      <View style={[S.cta, { marginTop: 12 }]}>
        <View style={{ width: '100%', height: 2, backgroundColor: GL, marginBottom: 16 }} />
        <Text style={S.ctaTitle}>Book Your Strategy Session</Text>
        <Text style={S.ctaBody}>
          A personalised 30-minute session maps your lender path, confirms the income recognition method that works in your favour, and initiates the pre-approval process.
        </Text>
        <Link src="https://calendly.com/andy-lkadvisor/30min" style={S.ctaBtn}>
          <Text style={S.ctaBtnTx}>Book Your Strategy Session &rarr;</Text>
        </Link>
        <Text style={S.ctaSub}>Andy Le · Mortgage & Property Financing Specialist · MortgageScore.cz</Text>
      </View>

      {/* Disclaimer */}
      <Text style={{ fontSize: 6, color: SU, marginTop: 10, lineHeight: 1.5 }}>
        This report was generated on {today} based on data provided by the applicant. All figures are indicative estimates using 2026 Czech bank underwriting methodology. They do not constitute a guarantee of approval, a lending offer, or financial advice. Actual terms depend on individual bank assessment, property valuation, credit history, and credit committee approval. Produced by MortgageScore.cz.
      </Text>

      <Ftr today={today} />
    </Page>
  )
}

/* ── Document ────────────────────────────────────── */

function MortgageDoc({ formData, userName }) {
  const resolved = (formData.netMonthlySalary > 0 ? formData.netMonthlySalary : formData.netIncome) ?? 0
  const merged   = { ...formData, netIncome: resolved, leadName: userName || formData.leadName }
  const score    = computeScore(merged)
  const profile  = computeMortgageProfile(merged)
  const today    = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  const ctx      = { formData: merged, profile, score, today }

  return (
    <Document title="Mortgage Score Assessment" author="MortgageScore.cz" subject="Mortgage Pre-Scoring Report">
      <Page1 ctx={ctx} />
      <Page2 ctx={ctx} />
      <Page3 ctx={ctx} />
    </Document>
  )
}

/* ── Export ──────────────────────────────────────── */

import { pdf } from '@react-pdf/renderer'

export async function generateReactPdf(formData, userName) {
  return pdf(<MortgageDoc formData={formData} userName={userName} />).toBlob()
}
