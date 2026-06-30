import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

const TESTIMONIALS = [
  {
    id: 't1',
    cardGradient: 'from-blue-700 via-blue-900 to-slate-900',
    headline: 'From Nepal to Homeownership',
    summary: 'After weeks of delays and pressure from the agency, our clients stayed patient and resilient. Today, they are finally holding the keys to their own home.',
    url: 'https://www.facebook.com/photo?fbid=876677978314893&set=a.188236427159055',
    image: '/testimonials/t1.jpg',
  },
  {
    id: 't2',
    cardGradient: 'from-violet-800 via-purple-900 to-slate-900',
    headline: 'Success Story',
    summary: 'Coming soon — stay tuned for another real client success story.',
    url: 'https://www.facebook.com/photo?fbid=828753879773970&set=a.188236427159055',
    image: '/testimonials/t2.jpg',
  },
  {
    id: 't3',
    cardGradient: 'from-emerald-800 via-teal-900 to-slate-900',
    headline: 'Dream Home Secured',
    summary: 'After countless viewings and unexpected obstacles, we found the perfect solution together. Now they are happily settled in their new home.',
    url: 'https://www.facebook.com/photo?fbid=763146343001391&set=a.188236427159055',
    image: '/testimonials/t3.jpg',
  },
  {
    id: 't4',
    cardGradient: 'from-sky-700 via-blue-900 to-slate-900',
    headline: 'Persistence Wins',
    summary: 'When others said financing was impossible, we took matters into our own hands. Mortgage approved and new apartment ready for joy.',
    url: 'https://www.facebook.com/photo?fbid=733631289286230&set=a.188236427159055',
    image: '/testimonials/t4.jpg',
  },
  {
    id: 't5',
    cardGradient: 'from-indigo-700 via-indigo-900 to-slate-900',
    headline: 'Overcoming Hurdles',
    summary: 'From daily calls to the mayor to navigating a dozen obstacles, our clients from Turkey finally secured their dream home.',
    url: 'https://www.facebook.com/photo/?fbid=719423324040360&set=a.188236427159055',
    image: '/testimonials/t5.jpg',
  },
  {
    id: 't6',
    cardGradient: 'from-teal-700 via-cyan-900 to-slate-900',
    headline: 'Investment Success',
    summary: 'Congratulations on securing a beautiful investment apartment. Another happy client successfully moved forward.',
    url: 'https://www.facebook.com/photo/?fbid=711247738191252&set=a.188236427159055',
    image: '/testimonials/t6.jpg',
  },
  {
    id: 't7',
    cardGradient: 'from-rose-800 via-pink-900 to-slate-900',
    headline: 'Resilience in Property',
    summary: "We navigated the seller's bankruptcy and other unexpected hurdles during the process. We finally crossed the finish line to ownership.",
    url: 'https://www.facebook.com/photo/?fbid=693770526605640&set=a.188236427159055',
    image: '/testimonials/t7.jpg',
  },
]

function TestimonialCard({ headline, summary, cardGradient, url, image }) {
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
        'group flex flex-col',
      ].join(' ')}
    >
      {/* Image — fixed height, center-cropped */}
      <div className="relative w-full h-52 flex-shrink-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${cardGradient}`} />
        <img
          src={image}
          alt={headline}
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => { e.currentTarget.style.opacity = '0' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content — fixed min-height keeps all cards the same total size */}
      <div className="bg-dark-800 p-5 flex flex-col flex-1">
        <h3 className="text-white font-display text-[14px] font-bold leading-snug mb-2.5">
          {headline}
        </h3>
        <p className="text-slate-400 text-[12px] leading-relaxed mb-4 flex-1">
          {summary}
        </p>
        <div className="flex items-center gap-1.5 text-brand-400 text-[11px] font-semibold group-hover:text-brand-300 transition-colors mt-auto">
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
