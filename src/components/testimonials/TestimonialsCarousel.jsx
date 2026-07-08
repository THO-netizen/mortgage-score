import { ExternalLink } from 'lucide-react'

const VIDEOS = [
  {
    id: '3043071172518775',
    title: 'How Czech Banks Calculate Your Max Loan',
    desc: 'The exact dual-test formula underwriters use to set your borrowing ceiling.',
  },
  {
    id: '2013647709171522',
    title: 'DSTI Explained in 60 Seconds',
    desc: 'Why Debt-Service-to-Income ratio is the single most important metric for approval.',
  },
  {
    id: '3893330600957610',
    title: 'OSVČ Mortgage Guide',
    desc: 'Self-employed applicants face different rules — here is what to prepare before you apply.',
  },
  {
    id: '1154782076481763',
    title: 'LTV: How Much Can You Borrow?',
    desc: 'Loan-to-Value ratio sets your down-payment requirement and monthly repayment.',
  },
  {
    id: '637035798952912',
    title: '5 Documents Every Applicant Needs',
    desc: 'Prepare these five documents before your strategy session to fast-track pre-approval.',
  },
  {
    id: '3505855822878034',
    title: 'Fixed vs. Variable Rate Mortgages',
    desc: 'Understanding fixed and variable rate products in the Czech mortgage market.',
  },
  {
    id: '1366161228843604',
    title: 'Why Your Bank Rejected You',
    desc: 'The most common rejection reasons and how to fix them before re-applying.',
  },
  {
    id: '1100785461993862',
    title: 'Income Recognition for Foreigners',
    desc: 'Non-Czech citizens face additional scrutiny on income — here is how to position your file.',
  },
  {
    id: '24632646016359230',
    title: 'CNB Stress Test Demystified',
    desc: 'The stress test checks if you can still repay if rates rise — here is how it works.',
  },
  {
    id: '1260234258673232',
    title: 'How to Increase Your Max Loan',
    desc: 'Three proven strategies to expand your borrowing capacity before submitting.',
  },
  {
    id: '750724387722459',
    title: 'Reservation Deposits Explained',
    desc: 'What happens to your deposit if financing falls through — and how to protect yourself.',
  },
  {
    id: '1945799819553534',
    title: 'When to Refinance Your Mortgage',
    desc: 'How to lock in a better rate at the end of your fixation period.',
  },
  {
    id: '2586878941676335',
    title: 'Property Valuation Process',
    desc: 'How banks assess value and why it can differ from your agreed purchase price.',
  },
  {
    id: '1150390016931385',
    title: 'Probation Period and Mortgages',
    desc: 'On probation at work? Here is how it affects eligibility and which banks are flexible.',
  },
  {
    id: '1339104001172260',
    title: 'Own Funds: How Much Do You Need?',
    desc: 'Minimum down-payment rules for Czech mortgages and strategies to reach the threshold.',
  },
  {
    id: '24294507180244451',
    title: 'Buying as an Expat in Czechia',
    desc: 'Residency status, permit requirements, and which Czech banks work with non-EU applicants.',
  },
  {
    id: '1551599372494437',
    title: 'Understanding the Land Registry',
    desc: 'What the katastru nemovitosti shows and why you must check it before signing.',
  },
  {
    id: '743326638737121',
    title: 'Mortgage Timeline: Week by Week',
    desc: 'From first inquiry to key handover — a realistic timeline for the Czech mortgage process.',
  },
  {
    id: '2953344864850635',
    title: 'Tax Benefits for Czech Homeowners',
    desc: 'Mortgage interest deductibility and other tax advantages available to property owners.',
  },
  {
    id: '1577214269933680',
    title: 'Red Flags: When Not to Buy',
    desc: 'Market signals, financial warning signs, and property issues that mean it is better to wait.',
  },
]

function VideoCard({ id, title, desc }) {
  const reelUrl = `https://www.facebook.com/reel/${id}/`
  const embedSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(reelUrl)}&show_text=false&width=500`

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-dark-800 overflow-hidden">
      {/* 9:16 portrait iframe container */}
      <div className="relative w-full" style={{ paddingBottom: '177.78%' }}>
        <iframe
          src={embedSrc}
          title={title}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          scrolling="no"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            overflow: 'hidden',
          }}
        />
      </div>

      {/* Card text */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-white font-semibold text-[13px] leading-snug mb-1.5">
          {title}
        </h3>
        <p className="text-slate-400 text-[11px] leading-relaxed flex-1 mb-3">
          {desc}
        </p>
        <a
          href={reelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-brand-400 text-[11px] font-semibold hover:text-brand-300 transition-colors"
        >
          Watch Tip
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  )
}

export default function MortgageTipsLibrary() {
  return (
    <section className="bg-dark-900 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-brand-400 text-[11px] font-bold tracking-[0.12em] uppercase mb-3">
            Free Video Library
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-4 leading-tight tracking-tight">
            Mortgage Tips &amp; Insights
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
            Free expert videos to help you understand Czech mortgages, improve your borrowing capacity,
            avoid common mistakes, and confidently navigate the entire home-buying process.
          </p>
        </div>

        {/* Responsive video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VIDEOS.map((v) => (
            <VideoCard key={v.id} {...v} />
          ))}
        </div>

      </div>
    </section>
  )
}
