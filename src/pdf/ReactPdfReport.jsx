import React from 'react'
import {
  Document, Page, View, Text, Link, Svg, Circle, Rect,
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
const N   = '#0F172A'
const NM  = '#1E293B'
const BR  = '#2563EB'
const WH  = '#FFFFFF'
const SF  = '#F8FAFC'
const BD  = '#E2E8F0'
const IN  = '#1E293B'
const MU  = '#64748B'
const SU  = '#94A3B8'
const OK  = '#10B981'
const WA  = '#F59E0B'
const RK  = '#EF4444'

const scCol = s => s >= 75 ? OK : s >= 55 ? BR : s >= 35 ? WA : RK
const scLab = s => s >= 75 ? 'Strong Applicant' : s >= 55 ? 'Good Standing' : s >= 35 ? 'Needs Review' : 'High Risk'

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
const CW = 595 - PM * 2   // 523 pt

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
  hdrBrand:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: N },
  hdrSub:    { fontSize: 6.5, color: MU, marginTop: 1 },
  hdrRight:  { alignItems: 'flex-end' },
  hdrLabel:  { fontSize: 7, color: SU },
  hdrPage:   { fontSize: 6.5, color: SU, marginTop: 2 },

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
  heroAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  heroRow:    { flexDirection: 'row' },
  heroDiv:    { width: 1, backgroundColor: '#334155', marginHorizontal: 14, alignSelf: 'stretch' },
  heroLbl:    { fontSize: 6.5, color: SU, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 },
  heroNum:    { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WH },
  heroSub:    { fontSize: 8, color: SU, marginTop: 3 },

  /* Section */
  secTitle: {
    fontSize: 7, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.8,
    color: MU, marginBottom: 7,
  },

  /* Card */
  card: {
    backgroundColor: WH, borderRadius: 4,
    borderWidth: 1, borderColor: BD,
    padding: 10, overflow: 'hidden',
  },
  cardDark: { backgroundColor: N, borderRadius: 4, padding: 16, overflow: 'hidden' },

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
  barRow: { marginBottom: 9 },
  barTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 3 },
  barLbl: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN },
  barSub: { fontSize: 6, color: MU, marginTop: 1 },
  barBg:  { height: 5, backgroundColor: BD, borderRadius: 3, overflow: 'hidden' },
  barFill:{ height: 5, borderRadius: 3 },
  barVal: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  barLim: { fontSize: 6.5, color: SU },

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

function ScoreBar({ score, color }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 5 }}>
        <Text style={{ fontSize: 26, fontFamily: 'Helvetica-Bold', color: WH }}>{score}</Text>
        <Text style={{ fontSize: 9, color: SU, marginLeft: 3 }}>/100</Text>
      </View>
      <View style={{ height: 5, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden', width: 90 }}>
        <View style={{ width: `${score}%`, height: 5, backgroundColor: color, borderRadius: 3 }} />
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

/* ── Underwriter's Perspective ───────────────────── */

function UnderwriterPerspective({ profile, formData }) {
  const { dstiAtEX, ltvPct, maxLTVPct, effectiveIncome, existingDebt, eX, maturity } = profile
  const years = maturity?.maxYears ?? 30
  const mp = eX > 0 ? monthlyPayment(eX, 4.89, years) : 0
  const surplus = Math.max(0, (effectiveIncome || 0) - mp - (existingDebt || 0) - 4_860)

  const dstiText = dstiAtEX > 40
    ? `At ${pctF(dstiAtEX)} DSTI, your estimated post-obligation surplus is ~${czkS(surplus)}/mo. Czech banks flag profiles where surplus falls below 20% of net income — your file is ${dstiAtEX > 44 ? 'above' : 'near'} that threshold and warrants a lender strategy.`
    : `Your ${pctF(dstiAtEX)} DSTI leaves an estimated surplus of ~${czkS(surplus)}/mo after all obligations. This signals strong repayment capacity and typically results in a lower risk rating at credit committee.`

  let secondTitle, secondText
  if (ltvPct > 75) {
    const pp = Number(formData.purchasePrice) || 0
    const of = Number(formData.ownFunds) || 0
    const revalLTV = pp > 0 ? ((pp - of) / (pp * 0.90) * 100) : ltvPct * 1.11
    secondTitle = 'Collateral Valuation Risk'
    secondText = `At ${pctF(ltvPct)} LTV, a conservative 10% downward revaluation by the bank's appraiser would push effective LTV to ~${revalLTV.toFixed(0)}%, close to the ${maxLTVPct}% cap. A modest increase in own funds builds resilience against this scenario.`
  } else if (formData.entityType === 'osvc') {
    secondTitle = 'Self-Employed Income Scrutiny'
    secondText = 'Underwriters cross-check declared tax-base income against bank statement turnover. Significant divergence triggers additional questions — having a clear margin explanation prepared reduces processing delays and minimises underwriting friction.'
  } else if (formData.entityType === 'sro') {
    secondTitle = 'Company Director Income Complexity'
    secondText = 'ESSO methodology requires underwriters to reconstruct income from 2 years of company financial statements and personal tax returns. Consistent, complete documentation across both years is the single largest factor in underwriting speed.'
  } else {
    const ct = formData.contractType
    secondTitle = 'Employment Contract Assessment'
    secondText = ct === 'indefinite'
      ? 'Indefinite contracts receive full income recognition with no haircut — the strongest employment basis for Czech mortgage underwriting. The underwriter verifies net pay against the employer confirmation letter.'
      : 'Fixed-term or non-standard contracts receive a proportional income haircut at most Czech banks. The underwriter verifies contract end date and length of continuous employment.'
  }

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={S.secTitle}>{"The Underwriter's Perspective"}</Text>
      <View style={S.card}>
        <View style={{ marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BD }}>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN, marginBottom: 3 }}>
            Monthly Surplus & Repayment Capacity
          </Text>
          <Text style={{ fontSize: 7, color: MU, lineHeight: 1.4 }}>{dstiText}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN, marginBottom: 3 }}>
            {secondTitle}
          </Text>
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

  const s1eX = safeCompute({ ...formData, ownFunds: (Number(formData.ownFunds) || 0) + 500_000 })
  const s2eX = safeCompute({ ...formData, monthlyLoanPayments: Math.max(0, (Number(formData.monthlyLoanPayments) || 0) - 2_000) })
  const s3eX = safeCompute({ ...formData, netIncome: Math.round((Number(formData.netIncome) || profile.effectiveIncome || 0) * 1.10) })

  const rows = [
    { action: 'Add 500k CZK to down-payment',      newEX: s1eX, delta: s1eX - base },
    { action: 'Reduce monthly debt load by 2k/mo', newEX: s2eX, delta: s2eX - base },
    { action: 'Increase recognised income by 10%', newEX: s3eX, delta: s3eX - base },
  ]

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={S.secTitle}>Scenario Optimisation — What Happens If...</Text>
      <View style={{ borderWidth: 1, borderColor: BD, borderRadius: 4, overflow: 'hidden' }}>
        <View style={S.tHdr}>
          <Text style={[S.tHCel, { flex: 3 }]}>If you...</Text>
          <Text style={[S.tHCel, { flex: 2, textAlign: 'right' }]}>New Max Loan</Text>
          <Text style={[S.tHCel, { flex: 2, textAlign: 'right' }]}>vs Baseline</Text>
        </View>
        {rows.map((r, i) => (
          <View key={i} style={[S.tRow, i === rows.length - 1 && { borderBottomWidth: 0 }, i % 2 === 1 && { backgroundColor: SF }]}>
            <Text style={[S.tCel, { flex: 3 }]}>{r.action}</Text>
            <Text style={[S.tCel, { flex: 2, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{czkS(r.newEX)}</Text>
            <Text style={[S.tCel, { flex: 2, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: r.delta >= 0 ? OK : RK }]}>
              {r.delta >= 0 ? '+' : ''}{czkS(Math.abs(r.delta))}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[S.footTxt, { marginTop: 4 }]}>
        {'Baseline: ' + czkS(base) + '. All scenarios use Czech dual-test methodology at 4.89% / 6.89%.'}
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
    'Company extract from Commercial Register (max 3 months old)',
    'UBO declaration and director employment or service contract',
  ] : [
    'Last 3 months payslips from all employers',
    'Employer salary confirmation (potvrzeni zamestnavatele)',
    contractType === 'indefinite'
      ? 'Indefinite employment contract — full copy'
      : 'Employment contract with confirmed end date',
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

/* ── PAGE 1 ──────────────────────────────────────── */

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
    { label: 'Debt Service (DSTI)', sub: 'at 4.89% fixation rate', value: dstiAtEX, limit: dstiLim,  binding: bottleneck === 'DSTI' },
    { label: 'Stress Test (DI Rate)', sub: 'at 6.89% stress rate',  value: stressDST, limit: 45,      binding: bottleneck !== 'DSTI' && bottleneck !== 'LTV' && bottleneck !== 'DTI' },
    { label: 'LTV (Loan-to-Value)',  sub: 'against collateral cap', value: ltvPct,   limit: maxLTVPct, binding: bottleneck === 'LTV' },
  ]

  const residLbl = {
    eu: 'EU Citizen', permanent: 'Permanent Res.',
    longterm5plus: 'Long-term 5+ yr', longterm: 'Long-term Res.',
    employment: 'Work / Business', other: 'Other',
  }[formData.residenceStatus] ?? '—'

  const entityLbl = { zamestnanec: 'Salaried', osvc: 'Self-Employed', sro: 's.r.o. Director' }[formData.entityType] ?? '—'
  const own = formData.purchasePrice > 0 ? ((formData.ownFunds / formData.purchasePrice) * 100).toFixed(0) + '%' : '—'
  const yrsLbl = { less1: '<1 yr', '1-2': '1-2 yr', '2-5': '2-5 yr', '5-10': '5-10 yr', '10plus': '10+ yr' }[formData.yearsInCZ] ?? ''

  return (
    <Page size="A4" style={S.page}>
      <Hdr label="Executive Summary" n={1} total={3} />

      {/* Hero */}
      <View style={S.hero}>
        <View style={[S.heroAccent, { backgroundColor: scColor }]} />
        <View style={S.heroRow}>

          {/* Score */}
          <View style={{ width: 110 }}>
            <Text style={S.heroLbl}>Eligibility Score</Text>
            <ScoreBar score={score} color={scColor} />
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: scColor, marginTop: 5 }}>{scLab(score)}</Text>
          </View>

          <View style={S.heroDiv} />

          {/* Max Loan */}
          <View style={{ flex: 1 }}>
            <Text style={S.heroLbl}>Estimated Maximum Loan</Text>
            <Text style={S.heroNum}>{czkS(eX)}</Text>
            {eXStress > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={S.heroLbl}>Stress-Tested Floor · 6.89%</Text>
                <Text style={[S.heroNum, { fontSize: 16, color: '#94A3B8' }]}>{czkS(eXStress)}</Text>
              </View>
            )}
          </View>

          <View style={S.heroDiv} />

          {/* Risk + Constraint */}
          <View style={{ flex: 1 }}>
            <Text style={S.heroLbl}>Risk Band</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: WH, marginBottom: 10 }}>{riskBand}</Text>
            <Text style={S.heroLbl}>Binding Constraint</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: WA }}>{bottleneck ?? 'Within Limits'}</Text>
            {formData.leadName ? (
              <View style={{ marginTop: 10 }}>
                <Text style={S.heroLbl}>Applicant</Text>
                <Text style={{ fontSize: 8, color: WH }}>{tr(formData.leadName, 30)}</Text>
              </View>
            ) : null}
          </View>

        </View>
      </View>

      {/* Two columns */}
      <View style={{ flexDirection: 'row' }}>

        {/* Constraint bars */}
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={S.secTitle}>Binding Constraint Analysis</Text>
          <View style={S.card}>
            {bars.map(b => {
              const color = b.value > b.limit ? RK : b.binding ? WA : OK
              return <Bar key={b.label} {...b} color={color} />
            })}
          </View>
        </View>

        {/* Profile snapshot */}
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
              <Text style={S.pSub}>{formData.entityType === 'osvc' ? tr(formData.naceSector || 'Sector—', 20) : formData.entityType === 'zamestnanec' ? ({ indefinite: 'Indefinite', definite: 'Fixed-term', agency: 'Agency', dpc: 'DPC' }[formData.contractType] ?? '—') : '—'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={[S.pCard, { marginRight: 5 }]}>
              <Text style={S.pLbl}>Recognised Income</Text>
              <Text style={S.pVal}>{effectiveIncome > 0 ? czkS(effectiveIncome) + '/mo' : '—'}</Text>
              <Text style={S.pSub}>{formData.entityType === 'osvc' ? 'From turnover' : formData.entityType === 'zamestnanec' ? 'Net salary' : 'ESSO assessed'}</Text>
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

/* ── PAGE 2 ──────────────────────────────────────── */

function Page2({ ctx }) {
  const { formData, profile, today } = ctx
  const { effectiveIncome, flags, bankResults, winnerBank, dstiAtEX } = profile

  const isOsvc   = formData.entityType === 'osvc'
  const coeff    = (formData.turnoverIncomePct ?? 70) / 100
  const cLabel   = `${formData.turnoverIncomePct ?? 70}%`
  const annNum   = Number(formData.annualTurnover ?? 0)
  const monNum   = Number(formData.avgMonthlyCreditTurnover ?? 0)
  const mA       = annNum > 0 ? Math.min(Math.round(annNum / 12 * coeff), 150_000) : null
  const mB       = monNum > 0 ? Math.min(Math.round(monNum * coeff), 150_000) : null
  const active   = flags.includes('flat_tax_method') ? 'B' : 'A'

  const COL = { bank: 136, cap: 48, tA: 62, tB: 62, max: 66, bind: 49 }

  return (
    <Page size="A4" style={S.page}>
      <Hdr label="Income & Capacity" n={2} total={3} />

      {/* Income section */}
      {isOsvc ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={S.secTitle}>Income Recognition — Method Comparison</Text>
          <View style={{ flexDirection: 'row' }}>

            {/* Method A */}
            <View style={[S.card, { flex: 1, marginRight: 6, borderColor: active === 'A' ? BR : BD, borderWidth: active === 'A' ? 1.5 : 1 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: IN }}>Method A — Tax Return</Text>
                {active === 'A' && (
                  <View style={{ backgroundColor: OK, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 }}>
                    <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: WH }}>APPLIED</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 6.5, color: MU, marginBottom: 6 }}>Annual turnover ÷ 12 × {cLabel} recognition rate</Text>
              {mA !== null ? (
                <View>
                  <Text style={{ fontSize: 6.5, color: MU }}>Recognised income</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: IN }}>{czkS(mA)}/mo</Text>
                  {annNum > 0 && <Text style={{ fontSize: 6, color: SU, marginTop: 2 }}>Annual basis: {czkS(annNum)}/yr</Text>}
                </View>
              ) : <Text style={{ fontSize: 6.5, color: SU }}>Annual turnover not entered</Text>}
            </View>

            {/* Method B */}
            <View style={[S.card, { flex: 1, marginRight: 6, borderColor: active === 'B' ? BR : BD, borderWidth: active === 'B' ? 1.5 : 1 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: IN }}>Method B — Bank Turnover</Text>
                {active === 'B' && (
                  <View style={{ backgroundColor: OK, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 }}>
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
              ) : <Text style={{ fontSize: 6.5, color: SU }}>Monthly bank turnover not entered</Text>}
            </View>

            {/* Applied total */}
            <View style={[S.card, { width: 100, backgroundColor: SF }]}>
              <Text style={{ fontSize: 6.5, color: MU, marginBottom: 3 }}>Applied Method</Text>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: BR, marginBottom: 8 }}>Method {active}</Text>
              <Text style={{ fontSize: 6.5, color: MU }}>Recognised</Text>
              <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: IN }}>{czkS(effectiveIncome)}/mo</Text>
              <Text style={{ fontSize: 6, color: SU, marginTop: 3 }}>Cap: 150k CZK/mo</Text>
            </View>

          </View>
        </View>
      ) : (
        <View style={{ marginBottom: 12 }}>
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

      {/* Bank table */}
      <Text style={S.secTitle}>Bank Loan Capacity — Dual-Test Breakdown</Text>
      <View style={{ borderWidth: 1, borderColor: BD, borderRadius: 4, overflow: 'hidden' }}>

        <View style={S.tHdr}>
          <Text style={[S.tHCel, { width: COL.bank }]}>Bank</Text>
          <Text style={[S.tHCel, { width: COL.cap,  textAlign: 'right' }]}>DSTI Cap</Text>
          <Text style={[S.tHCel, { width: COL.tA,   textAlign: 'right' }]}>Test A (DSTI)</Text>
          <Text style={[S.tHCel, { width: COL.tB,   textAlign: 'right' }]}>Test B (DI)</Text>
          <Text style={[S.tHCel, { width: COL.max,  textAlign: 'right' }]}>Max Loan</Text>
          <Text style={[S.tHCel, { width: COL.bind, textAlign: 'center' }]}>Binding</Text>
        </View>

        {BKEYS.map((key, i) => {
          const r   = bankResults?.[key]
          const isW = key === winnerBank
          return (
            <View key={key} style={[S.tRow, isW && { backgroundColor: '#F0FDF4' }, i === BKEYS.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ width: COL.bank, overflow: 'hidden' }}>
                <Text style={[S.tCel, isW && { fontFamily: 'Helvetica-Bold', color: OK }]}>
                  {tr(BNAMES[key] ?? key, 24)}{isW ? '  ★' : ''}
                </Text>
              </View>
              <Text style={[S.tMut, { width: COL.cap,  textAlign: 'right' }]}>{r?.effectiveDSTI > 0 ? pctF(r.effectiveDSTI * 100) : '—'}</Text>
              <Text style={[S.tMut, { width: COL.tA,   textAlign: 'right' }]}>{r?.maxByDSTI && isFinite(r.maxByDSTI) ? czkS(r.maxByDSTI) : '—'}</Text>
              <Text style={[S.tMut, { width: COL.tB,   textAlign: 'right' }]}>{r?.maxByDI > 0 ? czkS(r.maxByDI) : '—'}</Text>
              <Text style={[S.tCel, { width: COL.max,  textAlign: 'right', fontFamily: isW ? 'Helvetica-Bold' : 'Helvetica', color: isW ? OK : IN }]}>{r?.maxLoan > 0 ? czkS(r.maxLoan) : '—'}</Text>
              <Text style={[S.tMut, { width: COL.bind, textAlign: 'center' }]}>{r?.binding ?? '—'}</Text>
            </View>
          )
        })}

      </View>

      <Text style={[S.footTxt, { marginTop: 6, color: SU }]}>
        Selected bank (★) has the highest effective DSTI limit. Max Loan = MIN(Test A, Test B, DTI cap, LTV cap).
      </Text>

      {/* Scenario Optimisation */}
      <ScenarioOptimization formData={formData} profile={profile} />

      <Ftr today={today} />
    </Page>
  )
}

/* ── PAGE 3 ──────────────────────────────────────── */

function Page3({ ctx }) {
  const { formData, profile, score, today } = ctx
  const { bottleneck, redFlags, ltvPct, maxLTVPct, eX, eXStress, dstiAtEX } = profile

  const actions = []

  if (redFlags.length > 0) {
    actions.push({
      priority: 'Critical', color: RK,
      title: 'Resolve Hard Blocks Before Applying',
      text: `Your profile has ${redFlags.length} critical flag${redFlags.length > 1 ? 's' : ''} that will trigger automatic decline at most banks. Address these before any formal application.`,
    })
  }

  if (bottleneck === 'LTV' || ltvPct > maxLTVPct * 0.92) {
    actions.push({
      priority: 'High Impact', color: WA,
      title: 'Increase Down-Payment',
      text: `LTV is the binding constraint at ${ltvPct.toFixed(0)}% against a ${maxLTVPct}% cap. Increasing own funds by 5-10% directly expands borrowing capacity and improves rate pricing.`,
    })
  } else if (bottleneck === 'DSTI' || bottleneck === 'DI') {
    actions.push({
      priority: 'High Impact', color: WA,
      title: 'Reduce Monthly Obligation Load',
      text: 'Debt service ratio is the binding constraint. Closing credit card limits and paying down loans before application directly increases available DSTI headroom.',
    })
  } else if (bottleneck === 'DTI') {
    actions.push({
      priority: 'High Impact', color: WA,
      title: 'Reduce Outstanding Debt (DTI)',
      text: 'Total debt-to-income ratio is the cap. Reducing outstanding loan balances or increasing the annual income base are the highest-return actions available.',
    })
  }

  if (formData.entityType === 'osvc') {
    actions.push({
      priority: 'Strategy', color: BR,
      title: 'Select the Right Income Recognition Method',
      text: 'Two assessment methods are available (Tax Return vs Bank Turnover). The method applied determines your recognised income and which lender to approach first.',
    })
  }

  if (formData.entityType === 'osvc' && formData.businessAgeMonths !== null && formData.businessAgeMonths < 24) {
    actions.push({
      priority: formData.businessAgeMonths < 12 ? 'Critical' : 'High Impact',
      color: formData.businessAgeMonths < 12 ? RK : WA,
      title: formData.businessAgeMonths < 12 ? 'Establish 12-Month Trading History' : 'Reach 24-Month Threshold',
      text: formData.businessAgeMonths < 12
        ? 'Under 12 months of trading history. A continuity path from prior employment in the same sector may be the fastest qualifying route.'
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

      {/* Strategy */}
      <Text style={S.secTitle}>Recommended Strategy</Text>
      <View style={{ marginBottom: 10 }}>
        {actions.slice(0, 3).map((a, i) => (
          <StratItem key={i} n={i + 1} priority={a.priority} color={a.color} title={a.title} text={a.text} />
        ))}
      </View>

      {/* Pre-Approval Checklist */}
      <PreApprovalChecklist formData={formData} />

      {/* CTA block */}
      <View style={S.cta}>
        <View style={{ width: '100%', height: 2, backgroundColor: BR, marginBottom: 16 }} />
        <Text style={S.ctaTitle}>Book Your Strategy Session</Text>
        <Text style={S.ctaBody}>
          A personalised 30-minute session maps your lender path, confirms the income recognition method that works in your favour, and initiates the pre-approval process.
        </Text>
        <Link src="https://calendly.com/andy-lkadvisor/30min" style={S.ctaBtn}>
          <Text style={S.ctaBtnTx}>Book Your Strategy Session →</Text>
        </Link>
        <Text style={S.ctaSub}>Andy Le · Mortgage &amp; Property Financing Specialist · MortgageScore.cz</Text>
      </View>

      {/* Disclaimer */}
      <Text style={{ fontSize: 6, color: SU, marginTop: 10, lineHeight: 1.5 }}>
        This report was generated on {today} and is based on data provided by the applicant. All figures are indicative estimates based on 2026 Czech bank underwriting methodology. They do not constitute a guarantee of mortgage approval, a lending offer, or financial advice. Actual terms depend on individual bank assessment, property valuation, credit history, and credit committee approval. Produced by MortgageScore.cz.
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
