import React from 'react'
import {
  Document, Page, View, Text, Link, Svg, Circle,
  StyleSheet,
} from '@react-pdf/renderer'
import { pdf } from '@react-pdf/renderer'
import {
  computeScore, computeMortgageProfile, monthlyPayment,
  CONTRACT_RATE_PA, DUAL_STRESS_RATE_PA,
} from '../utils/scoringEngine.js'

/* ── Palette — ivory / bronze ─────────────────────── */
const N   = '#0F172A'
const NM  = '#1E293B'
const GL  = '#B8973A'
const GLA = '#FDF8EE'
const SF  = '#FAF7F0'
const WH  = '#FFFFFF'
const BD  = '#E8DDD0'
const IN  = '#1A1409'
const MU  = '#6B5E4A'
const SU  = '#9B8C78'
const OK  = '#2D7A4A'
const WA  = '#B8781E'
const RK  = '#A83030'
const BR  = '#2563EB'

/* ── Score helpers ────────────────────────────────── */
const scCol = s => s >= 75 ? OK : s >= 55 ? BR : s >= 35 ? WA : RK
const scLab = s =>
  s >= 75 ? 'Strong Applicant' :
  s >= 55 ? 'Good Standing' :
  s >= 35 ? 'Needs Review' : 'High Risk'

function heroMsg(s, name) {
  const p =
    s >= 75 ? "You're in a strong position" :
    s >= 55 ? "Your profile is well-positioned" :
    s >= 35 ? "Your profile shows clear potential" :
    "Your profile requires preparation"
  const n = name && name.trim() ? `, ${name.trim()}` : ''
  return `${p}${n}.`
}

/* ── Formatters ───────────────────────────────────── */
function czkS(n) {
  if (!n || n <= 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M CZK'
  if (n >= 1_000)     return Math.round(n / 1_000) + 'k CZK'
  return Math.round(n) + ' CZK'
}
function pctF(n) { return n != null ? n.toFixed(1) + '%' : '—' }
function tr(s, n) {
  if (!s) return '—'
  const t = String(s)
  return t.length > n ? t.slice(0, n - 1) + '...' : t
}

/* ── Page margin ──────────────────────────────────── */
const PM = 36

/* ── StyleSheet ───────────────────────────────────── */
const S = StyleSheet.create({
  page: {
    width: 595, height: 842,
    padding: PM, paddingBottom: PM + 28,
    backgroundColor: SF, fontFamily: 'Helvetica',
  },
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
  footer: {
    position: 'absolute', bottom: PM, left: PM, right: PM,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: BD, paddingTop: 5,
  },
  footTxt: { fontSize: 6, color: SU },
  hero: {
    backgroundColor: N, borderRadius: 4,
    padding: 16, marginBottom: 10, overflow: 'hidden',
  },
  heroRow: { flexDirection: 'row' },
  heroDiv: { width: 1, backgroundColor: '#334155', marginHorizontal: 14, alignSelf: 'stretch' },
  heroLbl: { fontSize: 6.5, color: SU, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 },
  heroNum: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WH },
  heroSub: { fontSize: 7.5, color: SU, marginTop: 3 },
  secTitle: {
    fontSize: 7, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.8,
    color: GL, marginBottom: 7,
  },
  card: {
    backgroundColor: WH, borderRadius: 4,
    borderWidth: 1, borderColor: BD,
    padding: 10, overflow: 'hidden',
  },
  pCard: {
    flex: 1, backgroundColor: WH,
    borderRadius: 4, borderWidth: 1, borderColor: BD,
    padding: 8, overflow: 'hidden',
  },
  pLbl: { fontSize: 6, textTransform: 'uppercase', letterSpacing: 0.5, color: SU, marginBottom: 3 },
  pVal: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: IN },
  pSub: { fontSize: 6, color: MU, marginTop: 2 },
  barRow:    { marginBottom: 9 },
  barTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 3 },
  barLbl:    { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN },
  barSub:    { fontSize: 6, color: MU, marginTop: 1 },
  barBg:     { height: 5, backgroundColor: BD, borderRadius: 3, overflow: 'hidden' },
  barFill:   { height: 5, borderRadius: 3 },
  barVal:    { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  barLim:    { fontSize: 6.5, color: SU },
  tHdr:  { flexDirection: 'row', backgroundColor: NM, paddingVertical: 5, paddingHorizontal: 8 },
  tRow:  { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: BD },
  tHCel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: SU, textTransform: 'uppercase' },
  tCel:  { fontSize: 7.5, color: IN },
  sNum:   { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: IN, flex: 1 },
  sBadge: { fontSize: 6, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3 },
  sBody:  { fontSize: 7, color: MU, lineHeight: 1.4, marginTop: 2 },
  cta:      { backgroundColor: N, borderRadius: 4, padding: 14, alignItems: 'center', overflow: 'hidden' },
  ctaTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: WH, textAlign: 'center', marginBottom: 6 },
  ctaBody:  { fontSize: 7.5, color: SU, textAlign: 'center', lineHeight: 1.45, marginBottom: 12, maxWidth: 360 },
  ctaBtn:   { backgroundColor: BR, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 22 },
  ctaBtnTx: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: WH },
  ctaSub:   { fontSize: 6.5, color: MU, marginTop: 7, textAlign: 'center' },
  chip:    { flex: 1, backgroundColor: WH, borderRadius: 4, borderWidth: 1, borderColor: BD, padding: 8, overflow: 'hidden' },
  chipLbl: { fontSize: 6, textTransform: 'uppercase', letterSpacing: 0.5, color: SU, marginBottom: 3 },
  chipVal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: IN },
})

/* ── Shared sub-components ────────────────────────── */

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

function ScoreGauge({ score, color }) {
  const R    = 34
  const circ = 2 * Math.PI * R
  const dash = (score / 100) * circ
  return (
    <View style={{ width: 80, height: 80 }}>
      <Svg width="80" height="80" viewBox="0 0 80 80">
        <Circle cx="40" cy="40" r={R} fill="none" stroke="#334155" strokeWidth="8" />
        <Circle cx="40" cy="40" r={R} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 40 40)" />
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
    <View style={{ flexDirection: 'row', marginBottom: 7 }}>
      <View style={[S.sNum, { backgroundColor: color }]}>
        <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: WH }}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={[S.sTitle, { marginRight: 5 }]}>{tr(title, 55)}</Text>
          <View style={[S.sBadge, { backgroundColor: color + '22', borderWidth: 0.5, borderColor: color + '66' }]}>
            <Text style={[S.sBadge, { color, padding: 0 }]}>{priority}</Text>
          </View>
        </View>
        <Text style={S.sBody}>{text}</Text>
      </View>
    </View>
  )
}

/* ── Own Funds Verdict ────────────────────────────── */

function OwnFundsCard({ formData, profile }) {
  const pp      = Number(formData.purchasePrice) || 0
  const of      = Number(formData.ownFunds) || 0
  const maxLTV  = profile.maxLTVPct || 80
  const reqPct  = 100 - maxLTV
  const required = pp * (reqPct / 100)
  const sufficient = of >= required
  const gap     = Math.max(0, required - of)
  const ltvPct  = profile.ltvPct || 0
  const color   = sufficient ? OK : RK

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={S.secTitle}>Own Funds Assessment</Text>
      <View style={[S.card, { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ width: 3, backgroundColor: color, alignSelf: 'stretch', borderRadius: 2, marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color }}>
              {sufficient ? 'Sufficient' : 'Needs Increase'}
            </Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: IN }}>{czkS(of)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 6.5, color: MU }}>
              {'Minimum required: ' + czkS(required) + ' (' + reqPct + '% of purchase)'}
            </Text>
            {!sufficient
              ? <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: RK }}>{'Shortfall: ' + czkS(gap)}</Text>
              : <Text style={{ fontSize: 6.5, color: OK }}>{'LTV: ' + ltvPct.toFixed(0) + '% — within ' + maxLTV + '% cap'}</Text>
            }
          </View>
        </View>
      </View>
    </View>
  )
}

/* ── Liabilities Card ─────────────────────────────── */

function LiabilitiesCard({ formData, profile }) {
  const debt    = Number(formData.monthlyLoanPayments) || 0
  const income  = profile.effectiveIncome || 1
  const debtPct = income > 1 ? (debt / income * 100) : 0
  const eX      = profile.eX || 0
  const years   = profile.maturity?.maxYears ?? 30
  const mortPay = eX > 0 ? monthlyPayment(eX, CONTRACT_RATE_PA, years) : 0
  const combined = income > 1 ? ((debt + mortPay) / income * 100) : 0
  const combColor = combined > 40 ? RK : combined > 35 ? WA : OK

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={S.secTitle}>Liabilities and Debt Service</Text>
      <View style={[S.card, { flexDirection: 'row' }]}>
        <View style={{ flex: 1, paddingRight: 10, marginRight: 10, borderRightWidth: 1, borderRightColor: BD }}>
          <Text style={{ fontSize: 6, color: SU, marginBottom: 2 }}>Existing Monthly Obligations</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: debt > 0 ? WA : OK }}>
            {debt > 0 ? czkS(debt) + '/mo' : 'None'}
          </Text>
          <Text style={{ fontSize: 6, color: MU, marginTop: 2 }}>
            {debt > 0 ? (debtPct.toFixed(0) + '% of recognised income') : 'No existing loan payments'}
          </Text>
        </View>
        <View style={{ flex: 1, paddingRight: 10, marginRight: 10, borderRightWidth: 1, borderRightColor: BD }}>
          <Text style={{ fontSize: 6, color: SU, marginBottom: 2 }}>Est. Mortgage Repayment</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: IN }}>{czkS(mortPay)}/mo</Text>
          <Text style={{ fontSize: 6, color: MU, marginTop: 2 }}>{`at ${CONTRACT_RATE_PA}% / ${years} yr term`}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 6, color: SU, marginBottom: 2 }}>Combined Debt Service</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: combColor }}>{pctF(combined)}</Text>
          <Text style={{ fontSize: 6, color: MU, marginTop: 2 }}>of income (45% CNB ceiling)</Text>
        </View>
      </View>
    </View>
  )
}

/* ── Expat Advisory (conditional) ────────────────── */

function ExpatAdvisory({ formData }) {
  const r = formData.residenceStatus
  if (r === 'eu' || r === 'permanent') return null

  const cfg = {
    longterm5plus: {
      title: 'Long-Term Residency (5+ Years)',
      verdict: 'Most Czech banks eligible',
      color: OK,
      note: 'With 5+ years of documented Czech residence, you qualify with mainstream lenders. A valid long-stay permit (OV) not expiring within 12 months of the mortgage term is required. Some lenders add a 5-10% LTV buffer.',
    },
    longterm: {
      title: 'Long-Term Residency (under 5 Years)',
      verdict: 'Selective lenders — enhanced documentation',
      color: WA,
      note: 'Under 5 years of residence limits access to specialist lenders. Banks require 24+ months of Czech banking history, stable income from a Czech entity, and a valid work or long-stay permit.',
    },
    employment: {
      title: 'Employment or Business Permit',
      verdict: 'Specialist lenders only',
      color: RK,
      note: 'Standard retail banks require permanent or long-term residence. Financing may be structured through employer-partnered banks, private banking divisions, or with a co-applicant holding stronger residency status.',
    },
    other: {
      title: 'Other Residency Status',
      verdict: 'Case-by-case assessment required',
      color: RK,
      note: 'Residency outside standard Czech mortgage criteria requires a bespoke assessment. Our team works with specialist lenders and private banking channels for non-standard residency profiles.',
    },
  }[r] || {
    title: 'Other Residency Status',
    verdict: 'Case-by-case assessment required',
    color: RK,
    note: 'Residency outside standard Czech mortgage criteria requires a bespoke assessment. Our team works with specialist lenders and private banking channels.',
  }

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={S.secTitle}>Expat Advisory — Residency Considerations</Text>
      <View style={[S.card, { flexDirection: 'row', alignItems: 'flex-start' }]}>
        <View style={{ width: 3, backgroundColor: cfg.color, alignSelf: 'stretch', borderRadius: 2, marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN }}>{cfg.title}</Text>
            <View style={{ backgroundColor: cfg.color + '22', borderWidth: 0.5, borderColor: cfg.color, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 }}>
              <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: cfg.color }}>{cfg.verdict}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7, color: MU, lineHeight: 1.4 }}>{cfg.note}</Text>
        </View>
      </View>
    </View>
  )
}

/* ── OSVČ Income Module ───────────────────────────── */

function OsvCModule({ formData, profile }) {
  const { flags, effectiveIncome } = profile
  const coeff   = (Number(formData.turnoverIncomePct) || 70) / 100
  const cLabel  = String(Number(formData.turnoverIncomePct) || 70) + '%'
  const annNum  = Number(formData.annualTurnover) || 0
  const monNum  = Number(formData.avgMonthlyCreditTurnover) || 0
  const mA      = annNum > 0 ? Math.min(Math.round(annNum / 12 * coeff), 150_000) : null
  const mB      = monNum > 0 ? Math.min(Math.round(monNum * coeff), 150_000) : null
  const active  = (flags && flags.includes('flat_tax_method')) ? 'B' : 'A'

  let optimalMethod = null
  if (mA !== null && mB !== null) { optimalMethod = mA >= mB ? 'A' : 'B' }
  else if (mA !== null) { optimalMethod = 'A' }
  else if (mB !== null) { optimalMethod = 'B' }

  const delta = (mA !== null && mB !== null) ? Math.abs(mA - mB) : null

  const bizName   = tr(formData.businessName || '', 30)
  const sector    = tr(formData.naceSector || '—', 28)
  const ageMonths = Number(formData.businessAgeMonths) || 0
  const ageYrs    = Math.floor(ageMonths / 12)
  const ageMo     = ageMonths % 12
  const ageLbl    = ageYrs > 0 ? (ageYrs + 'yr ' + ageMo + 'mo') : (ageMo + 'mo')
  const hasGap    = !!formData.businessActivityGap
  const taxLbl    = {
    dpfo_real: 'Real Expenses', dpfo_flat: 'Flat Rate (Pausalni)', flat_tax: 'Flat-Tax Band',
  }[formData.taxRegime] || (formData.taxRegime || '—')

  function Badge({ label, bgColor, textColor }) {
    return (
      <View style={{ backgroundColor: bgColor, borderRadius: 2, paddingHorizontal: 3, paddingVertical: 1 }}>
        <Text style={{ fontSize: 5.5, fontFamily: 'Helvetica-Bold', color: textColor }}>{label}</Text>
      </View>
    )
  }

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={S.secTitle}>Self-Employed Profile — Income Analysis</Text>

      {/* Business identity row */}
      <View style={[S.card, { marginBottom: 6, flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          {bizName ? <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: IN, marginBottom: 2 }}>{bizName}</Text> : null}
          <Text style={{ fontSize: 6.5, color: MU }}>{sector}</Text>
        </View>
        <View style={{ width: 1, backgroundColor: BD, marginHorizontal: 10 }} />
        <View style={{ alignItems: 'flex-end', minWidth: 60 }}>
          <Text style={{ fontSize: 6, color: SU, marginBottom: 1 }}>Trading</Text>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: ageMonths < 12 ? RK : ageMonths < 24 ? WA : IN }}>
            {ageLbl}
          </Text>
        </View>
        <View style={{ width: 1, backgroundColor: BD, marginHorizontal: 10 }} />
        <View style={{ alignItems: 'flex-end', minWidth: 75 }}>
          <Text style={{ fontSize: 6, color: SU, marginBottom: 1 }}>Tax Regime</Text>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: IN }}>{taxLbl}</Text>
        </View>
        <View style={{ width: 1, backgroundColor: BD, marginHorizontal: 10 }} />
        <View style={{ alignItems: 'flex-end', minWidth: 48 }}>
          <Text style={{ fontSize: 6, color: SU, marginBottom: 1 }}>Coeff.</Text>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: GL }}>{cLabel}</Text>
        </View>
      </View>

      {/* Interruption alert */}
      {hasGap && (
        <View style={{ backgroundColor: RK + '15', borderWidth: 1, borderColor: RK + '55', borderRadius: 4, padding: 7, marginBottom: 6, flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: RK, marginRight: 6 }}>ALERT</Text>
          <Text style={{ fontSize: 6.5, color: RK, flex: 1, lineHeight: 1.35 }}>
            Business activity gap detected. Most Czech banks require uninterrupted OSVC registration for 24+ months. Gaps exceeding 3 months may reset the trading duration clock and trigger automatic decline.
          </Text>
        </View>
      )}

      {/* Income method comparison table */}
      <View style={{ borderWidth: 1, borderColor: BD, borderRadius: 4, overflow: 'hidden' }}>
        <View style={S.tHdr}>
          <Text style={[S.tHCel, { flex: 2.5 }]}>Income Method</Text>
          <Text style={[S.tHCel, { flex: 2, textAlign: 'center' }]}>Basis</Text>
          <Text style={[S.tHCel, { flex: 1.5, textAlign: 'right' }]}>Recognised/mo</Text>
          <Text style={[S.tHCel, { width: 54, textAlign: 'right' }]}>Status</Text>
        </View>

        {/* Method A row */}
        <View style={[S.tRow, { backgroundColor: active === 'A' ? GLA : WH }]}>
          <Text style={[S.tCel, { flex: 2.5, fontFamily: active === 'A' ? 'Helvetica-Bold' : 'Helvetica' }]}>
            A — Tax Return (DPFO)
          </Text>
          <Text style={[S.tCel, { flex: 2, textAlign: 'center', color: MU }]}>
            {annNum > 0 ? (czkS(annNum) + '/yr x' + cLabel) : 'No data entered'}
          </Text>
          <Text style={[S.tCel, { flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: mA !== null ? IN : SU }]}>
            {mA !== null ? czkS(mA) : '—'}
          </Text>
          <View style={{ width: 54, alignItems: 'flex-end', justifyContent: 'center' }}>
            {active === 'A' && optimalMethod === 'A' && <Badge label="OPTIMAL" bgColor={GL} textColor={WH} />}
            {active === 'A' && optimalMethod !== 'A' && <Badge label="APPLIED" bgColor={BR + '22'} textColor={BR} />}
            {active !== 'A' && optimalMethod === 'A' && <Badge label="BETTER" bgColor={OK + '22'} textColor={OK} />}
          </View>
        </View>

        {/* Method B row */}
        <View style={[S.tRow, { backgroundColor: active === 'B' ? GLA : WH, borderBottomWidth: 0 }]}>
          <Text style={[S.tCel, { flex: 2.5, fontFamily: active === 'B' ? 'Helvetica-Bold' : 'Helvetica' }]}>
            B — Bank Turnover
          </Text>
          <Text style={[S.tCel, { flex: 2, textAlign: 'center', color: MU }]}>
            {monNum > 0 ? (czkS(monNum) + '/mo x' + cLabel) : 'No data entered'}
          </Text>
          <Text style={[S.tCel, { flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: mB !== null ? IN : SU }]}>
            {mB !== null ? czkS(mB) : '—'}
          </Text>
          <View style={{ width: 54, alignItems: 'flex-end', justifyContent: 'center' }}>
            {active === 'B' && optimalMethod === 'B' && <Badge label="OPTIMAL" bgColor={GL} textColor={WH} />}
            {active === 'B' && optimalMethod !== 'B' && <Badge label="APPLIED" bgColor={BR + '22'} textColor={BR} />}
            {active !== 'B' && optimalMethod === 'B' && <Badge label="BETTER" bgColor={OK + '22'} textColor={OK} />}
          </View>
        </View>
      </View>

      {/* Optimal method callout */}
      {optimalMethod && optimalMethod !== active && delta !== null && delta > 0 && (
        <View style={{ marginTop: 5, flexDirection: 'row', backgroundColor: OK + '12', borderRadius: 3, padding: 6, borderWidth: 0.5, borderColor: OK + '44' }}>
          <Text style={{ fontSize: 6.5, color: OK, flex: 1, lineHeight: 1.35 }}>
            {'Method ' + optimalMethod + ' would yield ' + czkS(delta) + '/mo more in recognised income. LK Advisor identifies which lenders accept Method ' + optimalMethod + ' for your trading profile.'}
          </Text>
        </View>
      )}
      {optimalMethod && optimalMethod === active && delta !== null && delta > 0 && (
        <Text style={{ fontSize: 6, color: MU, marginTop: 3 }}>
          {'Optimal method applied (Method ' + optimalMethod + '). Alternative yields ' + czkS(delta) + '/mo less. Recognition cap: 150,000 CZK/mo.'}
        </Text>
      )}
    </View>
  )
}

/* ── Employee Module ──────────────────────────────── */

function EmployeeModule({ formData, profile }) {
  const { effectiveIncome, dstiAtEX } = profile
  const ct         = formData.contractType
  const sector     = tr(formData.employmentSector || '—', 30)
  const probation  = formData.isProbation
  const probPeriod = Number(formData.probationPeriod) || 3

  const contractMap = {
    indefinite: { lbl: 'Indefinite Contract', color: OK },
    definite:   { lbl: 'Fixed-Term Contract', color: WA },
    agency:     { lbl: 'Agency Contract',     color: RK },
    dpc:        { lbl: 'DPC / Agreement',     color: RK },
  }
  const ctCfg = contractMap[ct] || { lbl: ct || 'Unknown', color: MU }

  const contractNote = {
    indefinite: 'Strongest employment basis — full income recognition at all Czech banks. The underwriter verifies net pay against the employer confirmation letter.',
    definite:   'Full recognition if the contract has been renewed consistently. Banks verify the end date and employment continuity.',
    agency:     'Agency contracts: most banks apply a 25-30% income haircut. Variable or overtime components are excluded from recognised income.',
    dpc:        'DPC/DPP agreements receive limited or no income recognition at standard Czech retail lenders. Standard employment income alongside is required.',
  }[ct] || 'Contract type requires individual bank assessment.'

  const showVariableWarn = ct === 'agency' || ct === 'dpc'
  const showProbWarn     = probation && probPeriod <= 3

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={S.secTitle}>Employment Profile — Income Assessment</Text>
      <View style={S.card}>

        {/* Contract type + income */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BD }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={{ backgroundColor: ctCfg.color + '22', borderWidth: 0.5, borderColor: ctCfg.color, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, marginRight: 6 }}>
                <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: ctCfg.color }}>{ctCfg.lbl}</Text>
              </View>
              {probation && (
                <View style={{ backgroundColor: WA + '22', borderWidth: 0.5, borderColor: WA, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: WA }}>Probation</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 6.5, color: MU, lineHeight: 1.35 }}>{contractNote}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 6, color: SU, marginBottom: 1 }}>Recognised Income</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: IN }}>{czkS(effectiveIncome)}/mo</Text>
            <Text style={{ fontSize: 6, color: SU, marginTop: 1 }}>Net salary basis</Text>
          </View>
        </View>

        {/* Sector + DSTI row */}
        <View style={{ flexDirection: 'row', marginBottom: (showVariableWarn || showProbWarn) ? 7 : 0 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 6, color: SU, marginBottom: 1 }}>Employment Sector</Text>
            <Text style={{ fontSize: 7.5, color: IN }}>{sector}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 6, color: SU, marginBottom: 1 }}>DSTI at Max Loan</Text>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: dstiAtEX > 40 ? WA : OK }}>{pctF(dstiAtEX)}</Text>
          </View>
        </View>

        {/* Variable income warning */}
        {showVariableWarn && (
          <View style={{ backgroundColor: WA + '15', borderRadius: 3, padding: 6, marginTop: 2, flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: WA, marginRight: 5, marginTop: 1 }}>NOTE</Text>
            <Text style={{ fontSize: 6.5, color: WA, flex: 1, lineHeight: 1.35 }}>
              Variable income, diets, and agency fees receive partial or no recognition at most Czech banks. Your assessed income uses only the verifiable stable component.
            </Text>
          </View>
        )}

        {/* Probation warning */}
        {showProbWarn && (
          <View style={{ backgroundColor: WA + '15', borderRadius: 3, padding: 6, marginTop: 4, flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: WA, marginRight: 5, marginTop: 1 }}>NOTE</Text>
            <Text style={{ fontSize: 6.5, color: WA, flex: 1, lineHeight: 1.35 }}>
              {'Active probation (' + probPeriod + ' months) restricts access at some lenders. Several banks require probation completion before mortgage approval.'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

/* ── Underwriter's Perspective ────────────────────── */

function UnderwriterPerspective({ profile, formData }) {
  const { dstiAtEX, ltvPct, maxLTVPct, effectiveIncome, existingDebt, eX, maturity } = profile
  const years   = maturity?.maxYears ?? 30
  const mp      = eX > 0 ? monthlyPayment(eX, CONTRACT_RATE_PA, years) : 0
  const surplus = Math.max(0, (effectiveIncome || 0) - mp - (existingDebt || 0) - 4_860)

  const dstiText = dstiAtEX > 40
    ? ('At ' + pctF(dstiAtEX) + ' DSTI, estimated post-obligation surplus is ~' + czkS(surplus) + '/mo. Czech banks flag profiles above 40% at credit committee — your file sits ' + (dstiAtEX > 44 ? 'above' : 'near') + ' that threshold.')
    : ('Your ' + pctF(dstiAtEX) + ' DSTI leaves ~' + czkS(surplus) + '/mo surplus after all obligations, signalling strong repayment capacity to the underwriting committee.')

  let secondTitle, secondText
  if (ltvPct > 75) {
    const pp = Number(formData.purchasePrice) || 0
    const of = Number(formData.ownFunds) || 0
    const rv = pp > 0 ? ((pp - of) / (pp * 0.90) * 100) : ltvPct * 1.11
    secondTitle = 'Collateral Valuation Risk'
    secondText  = 'At ' + pctF(ltvPct) + ' LTV, a 10% downward bank revaluation would push effective LTV to ~' + rv.toFixed(0) + '%, close to the ' + maxLTVPct + '% cap. A modest increase in own funds builds resilience against this scenario.'
  } else if (formData.entityType === 'osvc') {
    secondTitle = 'Self-Employed Income Scrutiny'
    secondText  = 'Underwriters cross-check declared tax-base income against bank statement turnover. Material divergence triggers additional documentation requests — a margin explanation prepared in advance minimises processing delays.'
  } else {
    const noteMap = {
      indefinite: 'Indefinite contracts receive full income recognition — the strongest employment basis for Czech mortgage underwriting. The underwriter verifies net pay against the employer confirmation letter.',
      definite:   'Fixed-term contracts: the underwriter verifies end date and renewal history. Consistent employment in the same role supports a stronger file across lenders.',
      agency:     'Agency contracts: underwriter applies a 25-30% income haircut. Base income is used; variable and overtime components are excluded from the recognised income calculation.',
      dpc:        'DPC/DPP agreements are not recognised as primary income at most Czech retail banks. Supplementary employment income alongside is required to build a qualifying profile.',
    }
    secondTitle = 'Employment Contract Assessment'
    secondText  = noteMap[formData.contractType] || 'Contract type requires individual assessment by lender.'
  }

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={S.secTitle}>The Underwriter's Perspective</Text>
      <View style={S.card}>
        <View style={{ marginBottom: 7, paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: BD }}>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN, marginBottom: 3 }}>Repayment Capacity Signal</Text>
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

/* ── Scenario Optimisation ────────────────────────── */

function ScenarioOptimization({ formData, profile }) {
  const base = profile.eX || 0
  function safe(fd) {
    try { return computeMortgageProfile(fd).eX || base } catch { return base }
  }
  const s1 = safe({ ...formData, ownFunds: (Number(formData.ownFunds) || 0) + 500_000 })
  const s2 = safe({ ...formData, monthlyLoanPayments: Math.max(0, (Number(formData.monthlyLoanPayments) || 0) - 2_000) })
  const s3 = safe({ ...formData, netIncome: Math.round((Number(formData.netIncome) || profile.effectiveIncome || 0) * 1.10) })

  const rows = [
    { action: 'Add 500k CZK to down-payment',          newEX: s1, delta: s1 - base },
    { action: 'Clear 2,000 CZK/mo in loan payments',   newEX: s2, delta: s2 - base },
    { action: 'Increase recognised income by 10%',     newEX: s3, delta: s3 - base },
  ]

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={S.secTitle}>Scenario Optimisation</Text>
      <View style={{ borderWidth: 1, borderColor: BD, borderRadius: 4, overflow: 'hidden' }}>
        <View style={S.tHdr}>
          <Text style={[S.tHCel, { flex: 3 }]}>If you...</Text>
          <Text style={[S.tHCel, { flex: 2, textAlign: 'right' }]}>New Max Loan</Text>
          <Text style={[S.tHCel, { flex: 1.5, textAlign: 'right' }]}>vs Baseline</Text>
        </View>
        {rows.map((r, i) => (
          <View key={i} style={[S.tRow, i === 2 && { borderBottomWidth: 0 }, i % 2 === 1 && { backgroundColor: SF }]}>
            <Text style={[S.tCel, { flex: 3 }]}>{r.action}</Text>
            <Text style={[S.tCel, { flex: 2, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{czkS(r.newEX)}</Text>
            <Text style={[S.tCel, { flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: r.delta >= 0 ? OK : RK }]}>
              {(r.delta >= 0 ? '+' : '') + czkS(Math.abs(r.delta))}
            </Text>
          </View>
        ))}
      </View>
      <Text style={{ fontSize: 6, color: SU, marginTop: 3 }}>{`Baseline: ${czkS(base)} · Dual-test at ${CONTRACT_RATE_PA}% / ${DUAL_STRESS_RATE_PA}%`}</Text>
    </View>
  )
}

/* ── Pre-Approval Checklist ───────────────────────── */

function PreApprovalChecklist({ formData }) {
  const { entityType, contractType } = formData
  const docs = entityType === 'osvc' ? [
    'Last 2 completed DPFO tax returns with tax office stamp',
    'Last 3 months business and personal bank statements',
    'Business registration extract (Zivnostnik, max 3 months)',
    'VAT returns last 4 quarters (if VAT-registered)',
    'Preliminary purchase agreement or letter of intent',
  ] : entityType === 'sro' ? [
    'Last 2 years company financials (rozvaha and VZZ)',
    'Last 2 years personal tax returns (DPFO)',
    'Company extract from Commercial Register (max 3 months)',
    'Employer confirmation letter from s.r.o. to director',
    'Preliminary purchase agreement or letter of intent',
  ] : [
    'Last 3 months payslips from all employers',
    'Employer salary confirmation (potvrzeni zamestnavatele)',
    contractType === 'indefinite' ? 'Indefinite employment contract — full copy' : 'Employment contract with confirmed end date',
    'Last 3 months bank statements (salary account)',
    'Preliminary purchase agreement or letter of intent',
  ]

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={S.secTitle}>Pre-Approval Document Checklist</Text>
      <View style={S.card}>
        {docs.map((doc, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: i < docs.length - 1 ? 4 : 0 }}>
            <View style={{ width: 7, height: 7, borderWidth: 1, borderColor: BD, borderRadius: 1, marginRight: 6, marginTop: 1 }} />
            <Text style={{ fontSize: 7, color: IN, flex: 1, lineHeight: 1.3 }}>{doc}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

/* ── Binding Constraint Summary ───────────────────── */

function BindingConstraintSummary({ profile }) {
  const { bottleneck, dstiAtEX, ltvPct, maxLTVPct, eX } = profile
  const explanation = bottleneck === 'DSTI'
    ? ('DSTI is binding at ' + pctF(dstiAtEX) + '. Reducing monthly obligations or selecting a lender with a higher DSTI cap directly increases available capacity.')
    : bottleneck === 'LTV'
    ? ('LTV is binding at ' + ltvPct.toFixed(0) + '% vs a ' + maxLTVPct + '% cap. Increasing own funds by 5% directly unlocks additional borrowing capacity.')
    : bottleneck === 'DTI'
    ? 'Total debt-to-income ratio is the binding constraint. Reducing outstanding loan balances or increasing the annual income base are the highest-return actions before application.'
    : ('Profile is within all primary limits. Maximum loan of ' + czkS(eX) + ' reflects income capacity and the best available DSTI ceiling.')
  const accentColor = bottleneck === 'LTV' ? RK : bottleneck ? WA : OK

  return (
    <View>
      <Text style={S.secTitle}>Binding Constraint Summary</Text>
      <View style={[S.card, { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ width: 3, backgroundColor: accentColor, alignSelf: 'stretch', borderRadius: 2, marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN, marginBottom: 3 }}>
            {bottleneck ? ('Binding: ' + bottleneck) : 'All Constraints Within Limits'}
          </Text>
          <Text style={{ fontSize: 7, color: MU, lineHeight: 1.4 }}>{explanation}</Text>
        </View>
      </View>
    </View>
  )
}

/* ── Real Costs Table ─────────────────────────────── */

function RealCostsTable({ formData, profile }) {
  const pp        = Number(formData.purchasePrice) || 0
  const reservation = pp > 0 ? Math.min(Math.max(50_000, Math.round(pp * 0.01)), 100_000) : 50_000
  const legalEscrow = 15_000
  const valuation   = 5_000
  const landReg     = 2_000
  const reserve     = pp > 0 ? Math.round(pp * 0.01) : 20_000
  const total       = reservation + legalEscrow + valuation + landReg + reserve

  const rows = [
    { item: 'Reservation deposit',       est: czkS(reservation),        note: 'Refundable if subject to financing clause' },
    { item: 'Legal / Notary (escrow)',   est: '~' + czkS(legalEscrow), note: 'Required for mortgage deed registration' },
    { item: 'Property valuation',        est: '~' + czkS(valuation),   note: 'Bank-commissioned; mandatory for mortgage' },
    { item: 'Land Registry lien fee',   est: czkS(landReg),            note: 'Flat filing fee for mortgage registration' },
    { item: 'Bank arrangement fee',      est: 'Typically 0',            note: 'Many lenders waive; confirm with advisor' },
    { item: 'Reserve buffer (~1%)',      est: '~' + czkS(reserve),     note: 'Recommended buffer for unexpected costs' },
  ]

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={S.secTitle}>Estimated Transaction Costs</Text>
      <View style={{ borderWidth: 1, borderColor: BD, borderRadius: 4, overflow: 'hidden' }}>
        <View style={S.tHdr}>
          <Text style={[S.tHCel, { flex: 2.2 }]}>Cost Item</Text>
          <Text style={[S.tHCel, { flex: 1.2, textAlign: 'right' }]}>Estimated</Text>
          <Text style={[S.tHCel, { flex: 2.5, textAlign: 'right' }]}>Notes</Text>
        </View>
        {rows.map((r, i) => (
          <View key={i} style={[S.tRow, i === rows.length - 1 && { borderBottomWidth: 0 }, i % 2 === 1 && { backgroundColor: SF }]}>
            <Text style={[S.tCel, { flex: 2.2 }]}>{r.item}</Text>
            <Text style={[S.tCel, { flex: 1.2, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{r.est}</Text>
            <Text style={[S.tCel, { flex: 2.5, textAlign: 'right', color: MU }]}>{r.note}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, backgroundColor: GLA, borderTopWidth: 1, borderTopColor: BD }}>
          <Text style={{ flex: 2.2, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: IN }}>Estimated Total (excl. bank fee)</Text>
          <Text style={{ flex: 1.2, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: GL, textAlign: 'right' }}>{czkS(total)}</Text>
          <Text style={{ flex: 2.5, fontSize: 6.5, color: MU, textAlign: 'right' }}>in addition to your down-payment</Text>
        </View>
      </View>
      <Text style={{ fontSize: 6, color: SU, marginTop: 4 }}>
        LK Advisor manages the entire purchase process at no charge to you — our biggest reward is your recommendation.
      </Text>
    </View>
  )
}

/* ── Mortgage Roadmap ─────────────────────────────── */

function MortgageRoadmap() {
  const steps = [
    { n: 1,  label: 'Pre-Scoring Assessment',   done: true  },
    { n: 2,  label: 'Strategy Session',          done: false, next: true },
    { n: 3,  label: 'Property Search and Offer', done: false },
    { n: 4,  label: 'Reservation Agreement',     done: false },
    { n: 5,  label: 'Bank Pre-Approval',         done: false },
    { n: 6,  label: 'Property Valuation',        done: false },
    { n: 7,  label: 'Full Mortgage Application', done: false },
    { n: 8,  label: 'Underwriting Review',       done: false },
    { n: 9,  label: 'Mortgage Contract Signing', done: false },
    { n: 10, label: 'Handover and Registration', done: false },
  ]

  function StepRow({ step }) {
    const dotBg    = step.done ? GL : step.next ? BR + '33' : BD
    const dotBd    = step.done ? GL : step.next ? BR : BD
    const textCol  = step.done ? GL : step.next ? BR : MU
    const numCol   = step.done ? WH : step.next ? BR : SU
    const isBold   = step.done || step.next
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: dotBg, borderWidth: 0.75, borderColor: dotBd, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
          <Text style={{ fontSize: step.done ? 5 : 5.5, fontFamily: 'Helvetica-Bold', color: numCol }}>
            {step.done ? 'OK' : step.n}
          </Text>
        </View>
        <Text style={{ fontSize: 6.5, color: textCol, fontFamily: isBold ? 'Helvetica-Bold' : 'Helvetica', flex: 1 }}>
          {step.label}
        </Text>
        {step.done && (
          <View style={{ backgroundColor: GL + '22', borderRadius: 2, paddingHorizontal: 3, paddingVertical: 1 }}>
            <Text style={{ fontSize: 5, fontFamily: 'Helvetica-Bold', color: GL }}>DONE</Text>
          </View>
        )}
        {step.next && (
          <View style={{ backgroundColor: BR + '22', borderRadius: 2, paddingHorizontal: 3, paddingVertical: 1 }}>
            <Text style={{ fontSize: 5, fontFamily: 'Helvetica-Bold', color: BR }}>NEXT</Text>
          </View>
        )}
      </View>
    )
  }

  const left  = steps.slice(0, 5)
  const right = steps.slice(5)

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={S.secTitle}>Your Mortgage Journey — 6 to 10 Weeks</Text>
      <View style={[S.card, { flexDirection: 'row' }]}>
        <View style={{ flex: 1, paddingRight: 12, marginRight: 12, borderRightWidth: 1, borderRightColor: BD }}>
          {left.map(s => <StepRow key={s.n} step={s} />)}
        </View>
        <View style={{ flex: 1 }}>
          {right.map(s => <StepRow key={s.n} step={s} />)}
        </View>
      </View>
    </View>
  )
}

/* ── PAGE 1 — Executive Summary ─────────────────────── */

function Page1({ ctx }) {
  const { formData, profile, score, today } = ctx
  const {
    eX, eXStress, dstiAtEX, ltvPct, maxLTVPct,
    bottleneck, winnerBank, bankResults, maturity,
    existingDebt, effectiveIncome, riskStatus,
  } = profile

  const scColor  = scCol(score)
  const riskBand = { zelena: 'Low Risk', oranzova: 'Moderate Risk', cervena: 'Higher Risk' }[riskStatus] || 'Under Assessment'
  const winnerR   = bankResults?.[winnerBank]
  const dstiLim   = winnerR?.effectiveDSTI != null ? winnerR.effectiveDSTI * 100 : 45
  const stressPay = eX > 0 && (maturity?.maxYears > 0)
    ? monthlyPayment(eX, DUAL_STRESS_RATE_PA, maturity.maxYears) : 0
  const stressDST = effectiveIncome > 0
    ? Math.min(99, ((stressPay + (existingDebt || 0)) / effectiveIncome) * 100) : 0

  const bars = [
    { label: 'Debt Service (DSTI)', sub: `at ${CONTRACT_RATE_PA}% fixation rate`,       value: dstiAtEX,  limit: dstiLim, binding: bottleneck === 'DSTI' },
    { label: `Stress Test (+1%)`,   sub: `at ${DUAL_STRESS_RATE_PA}% · limit ${dstiLim.toFixed(0)}%`, value: stressDST, limit: dstiLim, binding: bottleneck === 'DSTI' },
    { label: 'LTV (Loan-to-Value)', sub: 'against collateral cap',                       value: ltvPct,    limit: maxLTVPct, binding: bottleneck === 'LTV' },
  ]

  const residLbl = {
    eu: 'EU Citizen', permanent: 'Permanent Res.',
    longterm5plus: 'Long-term 5+ yr', longterm: 'Long-term Res.',
    employment: 'Work Permit', other: 'Other',
  }[formData.residenceStatus] || '—'

  const entityLbl = { zamestnanec: 'Salaried', osvc: 'Self-Employed', sro: 's.r.o. Director' }[formData.entityType] || '—'
  const own       = formData.purchasePrice > 0 ? ((formData.ownFunds / formData.purchasePrice) * 100).toFixed(0) + '%' : '—'
  const yrsLbl    = { less1: '<1yr', '1-2': '1-2yr', '2-5': '2-5yr', '5-10': '5-10yr', '10plus': '10+yr' }[formData.yearsInCZ] || ''
  const dname     = tr(formData.leadName || '', 22)

  return (
    <Page size="A4" style={S.page}>
      <Hdr label="Executive Summary" n={1} total={3} />

      {/* Hero */}
      <View style={S.hero}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, backgroundColor: GL }} />
        <View style={S.heroRow}>

          {/* Score + hero sentence */}
          <View style={{ width: 128 }}>
            <ScoreGauge score={score} color={scColor} />
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: scColor, marginTop: 6 }}>{scLab(score)}</Text>
            <Text style={{ fontSize: 7.5, color: WH, lineHeight: 1.4, marginTop: 6 }}>{heroMsg(score, dname)}</Text>
          </View>

          <View style={S.heroDiv} />

          {/* Max loan + stress floor */}
          <View style={{ flex: 1 }}>
            <View style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
              <Text style={S.heroLbl}>Estimated Maximum Loan</Text>
              <Text style={S.heroNum}>{czkS(eX)}</Text>
              <Text style={S.heroSub}>{'Based on ' + czkS(effectiveIncome) + '/mo recognised income'}</Text>
            </View>
            {eXStress > 0 && eXStress < eX && (
              <View>
                <Text style={S.heroLbl}>Stress-Tested Floor · {DUAL_STRESS_RATE_PA}%</Text>
                <Text style={[S.heroNum, { fontSize: 16, color: SU }]}>{czkS(eXStress)}</Text>
                <Text style={S.heroSub}>DI floor at legacy stress rate</Text>
              </View>
            )}
          </View>

          <View style={S.heroDiv} />

          {/* Risk + constraint */}
          <View style={{ width: 100 }}>
            <Text style={S.heroLbl}>Risk Band</Text>
            <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: WH, marginBottom: 12 }}>{riskBand}</Text>
            <Text style={S.heroLbl}>Binding Constraint</Text>
            <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: WA }}>{bottleneck || 'Within Limits'}</Text>
          </View>

        </View>
      </View>

      {/* Constraint bars + Profile snapshot */}
      <View style={{ flexDirection: 'row', marginBottom: 0 }}>

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
                  ? tr(formData.naceSector || 'General trade', 18)
                  : ({ indefinite: 'Indefinite', definite: 'Fixed-term', agency: 'Agency', dpc: 'DPC' }[formData.contractType] || '—')}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={[S.pCard, { marginRight: 5 }]}>
              <Text style={S.pLbl}>Recognised Income</Text>
              <Text style={S.pVal}>{effectiveIncome > 0 ? czkS(effectiveIncome) + '/mo' : '—'}</Text>
              <Text style={S.pSub}>{formData.entityType === 'osvc' ? 'Turnover-based' : 'Net salary'}</Text>
            </View>
            <View style={S.pCard}>
              <Text style={S.pLbl}>Property</Text>
              <Text style={S.pVal}>{czkS(formData.purchasePrice)}</Text>
              <Text style={S.pSub}>{own + ' own funds · LTV ' + ltvPct.toFixed(0) + '%'}</Text>
            </View>
          </View>
        </View>

      </View>

      {/* Own Funds */}
      <OwnFundsCard formData={formData} profile={profile} />

      {/* Liabilities */}
      <LiabilitiesCard formData={formData} profile={profile} />

      {/* Expat Advisory (conditional) */}
      <ExpatAdvisory formData={formData} />

      <Ftr today={today} />
    </Page>
  )
}

/* ── PAGE 2 — Income Profile ──────────────────────── */

function Page2({ ctx }) {
  const { formData, profile, today } = ctx
  const isOsvc = formData.entityType === 'osvc'

  return (
    <Page size="A4" style={S.page}>
      <Hdr label={isOsvc ? 'Income Profile — Self-Employed' : 'Income Profile — Employment'} n={2} total={3} />

      {isOsvc
        ? <OsvCModule formData={formData} profile={profile} />
        : <EmployeeModule formData={formData} profile={profile} />
      }

      <UnderwriterPerspective profile={profile} formData={formData} />

      <ScenarioOptimization formData={formData} profile={profile} />

      <PreApprovalChecklist formData={formData} />

      <BindingConstraintSummary profile={profile} />

      <Ftr today={today} />
    </Page>
  )
}

/* ── PAGE 3 — Strategy and Next Steps ──────────────── */

function Page3({ ctx }) {
  const { formData, profile, score, today } = ctx
  const { bottleneck, redFlags, ltvPct, maxLTVPct, eX, eXStress, dstiAtEX } = profile

  const actions = []

  if (redFlags && redFlags.length > 0) {
    actions.push({
      priority: 'Critical', color: RK,
      title: 'Resolve Hard Blocks Before Applying',
      text: 'Your profile has ' + redFlags.length + ' critical flag' + (redFlags.length > 1 ? 's' : '') + ' that trigger automatic decline at most banks. These must be resolved before any formal application.',
    })
  }

  if (bottleneck === 'LTV' || ltvPct > maxLTVPct * 0.92) {
    actions.push({
      priority: 'High Impact', color: WA,
      title: 'Increase Down-Payment',
      text: 'LTV is binding at ' + ltvPct.toFixed(0) + '% vs a ' + maxLTVPct + '% cap. Increasing own funds by 5-10% expands borrowing capacity and improves rate pricing.',
    })
  } else if (bottleneck === 'DSTI' || bottleneck === 'DI') {
    actions.push({
      priority: 'High Impact', color: WA,
      title: 'Reduce Monthly Obligation Load',
      text: 'Debt service ratio is the binding constraint. Closing credit card limits and paying down revolving credit directly increases DSTI headroom before application.',
    })
  }

  if (formData.entityType === 'osvc') {
    actions.push({
      priority: 'Strategy', color: GL,
      title: 'Select Optimal Income Method',
      text: 'Method A (tax return) vs Method B (bank turnover) yields materially different recognised income across lenders. The method selection determines the optimal bank to approach first.',
    })
  }

  if (formData.entityType === 'osvc' && formData.businessAgeMonths != null && formData.businessAgeMonths < 24) {
    actions.push({
      priority: formData.businessAgeMonths < 12 ? 'Critical' : 'High Impact',
      color: formData.businessAgeMonths < 12 ? RK : WA,
      title: formData.businessAgeMonths < 12 ? 'Establish 12-Month Trading History' : 'Reach 24-Month Threshold',
      text: formData.businessAgeMonths < 12
        ? 'Under 12 months of trading triggers automatic decline at most Czech banks. A continuity path from prior employment in the same sector may be the fastest qualifying route.'
        : 'At ' + formData.businessAgeMonths + ' months, a 15% income haircut applies. Crossing 24 months removes this haircut and unlocks full income recognition.',
    })
  }

  while (actions.length < 2) {
    actions.push({
      priority: score >= 75 ? 'Next Step' : 'Recommended', color: OK,
      title: 'Book a Strategy Session',
      text: score >= 75
        ? 'Profile is submission-ready. A 30-min session selects the optimal lender, locks in the best rate, and initiates pre-approval within 2-3 weeks.'
        : 'A strategy session maps your lender options, confirms the income path in your favour, and sets a clear improvement timeline.',
    })
  }

  return (
    <Page size="A4" style={S.page}>
      <Hdr label="Strategy and Next Steps" n={3} total={3} />

      {/* Metric chips */}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {[
          { lbl: 'Max Loan',           val: czkS(eX) },
          { lbl: `Stress Floor ${DUAL_STRESS_RATE_PA}%`, val: eXStress > 0 && eXStress < eX ? czkS(eXStress) : czkS(eX) },
          { lbl: 'DSTI',               val: pctF(dstiAtEX) },
          { lbl: 'Readiness Score',    val: score + ' / 100' },
        ].map(({ lbl, val }, i) => (
          <View key={lbl} style={[S.chip, i < 3 && { marginRight: 6 }]}>
            <Text style={S.chipLbl}>{lbl}</Text>
            <Text style={S.chipVal}>{val}</Text>
          </View>
        ))}
      </View>

      {/* Real Costs Table */}
      <RealCostsTable formData={formData} profile={profile} />

      {/* Mortgage Roadmap */}
      <MortgageRoadmap />

      {/* Action Plan */}
      <Text style={S.secTitle}>Your Action Plan</Text>
      <View style={{ marginBottom: 8 }}>
        {actions.slice(0, 3).map((a, i) => (
          <StratItem key={i} n={i + 1} priority={a.priority} color={a.color} title={a.title} text={a.text} />
        ))}
      </View>

      {/* CTA */}
      <View style={[S.cta, { marginTop: 6 }]}>
        <View style={{ width: '100%', height: 2, backgroundColor: GL, marginBottom: 12 }} />
        <Text style={S.ctaTitle}>Book Your Strategy Session</Text>
        <Text style={S.ctaBody}>
          A personalised 30-minute session maps your lender path, confirms the income recognition method that works in your favour, and initiates the pre-approval process.
        </Text>
        <Link src="https://calendly.com/andy-lkadvisor/30min" style={S.ctaBtn}>
          <Text style={S.ctaBtnTx}>Book Your Strategy Session</Text>
        </Link>
        <Text style={S.ctaSub}>Andy Le · Mortgage and Property Financing Specialist · MortgageScore.cz</Text>
      </View>

      {/* Disclaimer */}
      <Text style={{ fontSize: 6, color: SU, marginTop: 7, lineHeight: 1.45 }}>
        {`This report was generated on ${today} based on data provided by the applicant. All figures are indicative estimates using 2026 Czech bank underwriting methodology (dual-test at ${CONTRACT_RATE_PA}% / ${DUAL_STRESS_RATE_PA}%). They do not constitute a guarantee of approval, a lending offer, or financial advice. Actual terms depend on individual bank assessment, property valuation, credit history, and credit committee approval. Produced by MortgageScore.cz.`}
      </Text>

      <Ftr today={today} />
    </Page>
  )
}

/* ── Document ─────────────────────────────────────── */

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

/* ── Export ───────────────────────────────────────── */

export async function generateReactPdf(formData, userName) {
  return pdf(<MortgageDoc formData={formData} userName={userName} />).toBlob()
}
