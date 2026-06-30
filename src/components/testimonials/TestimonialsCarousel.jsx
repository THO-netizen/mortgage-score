import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

const TESTIMONIALS = [
  {
    id: 't1',
    badge: 'Expat',
    badgeGradient: 'from-brand-600 to-brand-800',
    cardGradient: 'from-blue-700 via-blue-900 to-slate-900',
    headline: 'From 3 bank rejections to approved in 4 weeks',
    summary: 'A UK national on a Work Permit was turned down by three Czech banks before pre-scoring identified the right lender. Mortgage closed in 26 days.',
    url: 'https://www.facebook.com/photo?fbid=876677978314893&set=a.188236427159055',
    image: '/testimonials/t1.jpg',
  },
  {
    id: 't2',
    badge: 's.r.o. Director',
    badgeGradient: 'from-violet-600 to-purple-800',
    cardGradient: 'from-violet-800 via-purple-900 to-slate-900',
    headline: 'S.r.o. income fully accepted — 4.6M CZK approved',
    summary: "A German director extracting income through his Czech s.r.o. found most banks don't understand ESSO methodology. The right lender assessed his full corporate income.",
    url: 'https://www.facebook.com/photo?fbid=828753879773970&set=a.188236427159055',
    image: '/testimonials/t2.jpg',
  },
  {
    id: 't3',
    badge: 'OSVČ',
    badgeGradient: 'from-emerald-600 to-teal-800',
    cardGradient: 'from-emerald-800 via-teal-900 to-slate-900',
    headline: 'Freelance developer, 2 years self-employed — mortgage granted',
    summary: 'An OSVČ IT consultant was convinced no bank would lend to him. Pre-scoring matched him to two lenders and he closed on a Brno flat within 8 weeks.',
    url: 'https://www.facebook.com/photo?fbid=763146343001391&set=a.188236427159055',
    image: '/testimonials/t3.jpg',
  },
  {
    id: 't4',
    badge: 'Expat',
    badgeGradient: 'from-sky-600 to-blue-800',
    cardGradient: 'from-sky-700 via-blue-900 to-slate-900',
    headline: 'Non-Czech speaker bought in Prague 2 — 6 weeks start to finish',
    summary: 'A French marketing professional with Permanent Residence completed her entire mortgage journey in English, from pre-scoring to signing the purchase contract.',
    url: 'https://www.facebook.com/photo?fbid=733631289286230&set=a.188236427159055',
    image: '/testimonials/t4.jpg',
  },
  {
    id: 't5',
    badge: 's.r.o. Director',
    badgeGradient: 'from-indigo-600 to-violet-800',
    cardGradient: 'from-indigo-700 via-indigo-900 to-slate-900',
    headline: 'Two companies, complex structure — still got the mortgage',
    summary: 'Operating two Czech s.r.o. entities, this Ukrainian director needed a bank that understood cross-entity income consolidation. Pre-scoring found one.',
    url: 'https://www.facebook.com/photo/?fbid=719423324040360&set=a.188236427159055',
    image: '/testimonials/t5.jpg',
  },
  {
    id: 't6',
    badge: 'OSVČ',
    badgeGradient: 'from-teal-600 to-cyan-800',
    cardGradient: 'from-teal-700 via-cyan-900 to-slate-900',
    headline: 'Annual income 840K CZK — bought a 3.8M flat solo',
    summary: "An OSVČ designer using the paušální výdaj flat-cost regime was sceptical she'd qualify. Her taxable base looked low — but the right bank assessed her actual cashflow.",
    url: 'https://www.facebook.com/photo/?fbid=711247738191252&set=a.188236427159055',
    image: '/testimonials/t6.jpg',
  },
  {
    id: 't7',
    badge: 'Expat',
    badgeGradient: 'from-rose-600 to-pink-800',
    cardGradient: 'from-rose-800 via-pink-900 to-slate-900',
    headline: 'Permanent residence first — then the mortgage immediately followed',
    summary: 'An American software engineer got strategic advice to secure Permanent Residence before applying. Six months later he closed on a 5.2M CZK flat in Vinohrady.',
    url: 'https://www.facebook.com/photo/?fbid=693770526605640&set=a.188236427159055',
    image: '/testimonials/t7.jpg',
  },
]

function TestimonialCard({ headline, summary, badge, badgeGradient, cardGradient, url, image }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        'testimonial-card',
        'flex-shrink-0 w-[calc(100vw-56px)] max-w-[300px] sm:w-[300px]',
        'rounded-xl overflow-hidden snap-start',
        'border border-white/10',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(37,99,235,0.30)]',
        'group',
      ].join(' ')}
    >
      {/* Image / gradient header */}
      <div className="relative h-44 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${cardGradient}`} />
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.opacity = '0' }}
        />
        {/* Dark overlay on hover for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${badgeGradient} shadow`}>
            {badge}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-dark-800 p-5">
        <h3 className="text-white font-display text-[14px] font-bold leading-snug mb-2.5">
          {headline}
        </h3>
        <p className="text-slate-400 text-[12px] leading-relaxed mb-4">
          {summary}
        </p>
        <div className="flex items-center gap-1.5 text-brand-400 text-[11px] font-semibold group-hover:text-brand-300 transition-colors">
          Read full story
          <ExternalLink size={10} />
        </div>
      </div>
    </a>
  )
}

export default function TestimonialsCarousel() {
  const scrollRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [canPrev, setCanPrev]   = useState(false)
  const [canNext, setCanNext]   = useState(true)

  const getCardStep = () => {
    const el = scrollRef.current
    if (!el) return 324
    const card = el.querySelector('.testimonial-card')
    return card ? card.offsetWidth + 24 : 324  // card width + gap-6 (24px)
  }

  const scrollBy = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * getCardStep(), behavior: 'smooth' })
  }

  const scrollToIndex = (i) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: i * getCardStep(), behavior: 'smooth' })
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      setCanPrev(el.scrollLeft > 10)
      setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
      const step = getCardStep()
      setActiveIdx(Math.min(Math.round(el.scrollLeft / step), TESTIMONIALS.length - 1))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section className="bg-dark-900 py-20 overflow-hidden">
      {/* Scrollbar suppression */}
      <style>{`#t-track::-webkit-scrollbar { display: none; }`}</style>

      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <div className="text-center px-4 mb-12">
          <p className="text-brand-400 text-[11px] font-bold tracking-[0.12em] uppercase mb-3">
            Client Stories
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-4 leading-tight tracking-tight">
            Real Clients. Real Mortgage Success.
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            See how expats, freelancers and business owners successfully financed
            property in Czechia.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">

          {/* Prev arrow */}
          <button
            onClick={() => scrollBy(-1)}
            disabled={!canPrev}
            aria-label="Previous testimonial"
            className={[
              'hidden sm:flex absolute left-2 top-[88px] z-10',
              'w-10 h-10 rounded-full items-center justify-center',
              'bg-dark-800 border border-white/10 text-white',
              'transition-all duration-150',
              canPrev
                ? 'opacity-100 hover:bg-dark-700 hover:border-brand-500/40 cursor-pointer'
                : 'opacity-0 pointer-events-none',
            ].join(' ')}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Scroll track */}
          <div
            id="t-track"
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2 px-6 sm:px-14"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.id} {...t} />
            ))}
            {/* End spacer */}
            <div className="flex-shrink-0 w-2" aria-hidden="true" />
          </div>

          {/* Next arrow */}
          <button
            onClick={() => scrollBy(1)}
            disabled={!canNext}
            aria-label="Next testimonial"
            className={[
              'hidden sm:flex absolute right-2 top-[88px] z-10',
              'w-10 h-10 rounded-full items-center justify-center',
              'bg-dark-800 border border-white/10 text-white',
              'transition-all duration-150',
              canNext
                ? 'opacity-100 hover:bg-dark-700 hover:border-brand-500/40 cursor-pointer'
                : 'opacity-0 pointer-events-none',
            ].join(' ')}
          >
            <ChevronRight size={18} />
          </button>

        </div>

        {/* Navigation dots */}
        <div className="flex justify-center items-center gap-2 mt-6 px-4">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={[
                'rounded-full transition-all duration-300 focus:outline-none',
                i === activeIdx
                  ? 'w-5 h-1.5 bg-brand-400'
                  : 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-500',
              ].join(' ')}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
