import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import { carouselRegistry } from '../../hooks/carouselRegistry.js'

const TESTIMONIALS = [
  {
    id: 't1',
    headline: 'From Nepal to homeownership',
    summary: 'After weeks of delays and pressure from the agency, our clients stayed patient. Today they hold the keys to their own home.',
    url: 'https://www.facebook.com/photo?fbid=876677978314893&set=a.188236427159055',
    image: '/testimonials/from-nepal-to-homeownership.png',
  },
  {
    id: 't3',
    headline: 'Dream home secured',
    summary: 'After countless viewings and unexpected obstacles, we found the perfect solution together.',
    url: 'https://www.facebook.com/photo?fbid=763146343001391&set=a.188236427159055',
    image: '/testimonials/dream-home-secured.png',
  },
  {
    id: 't4',
    headline: 'Persistence wins',
    summary: 'When others said financing was impossible, we took matters into our own hands. Mortgage approved.',
    url: 'https://www.facebook.com/photo?fbid=733631289286230&set=a.188236427159055',
    image: '/testimonials/persistence-wins.png',
  },
  {
    id: 't5',
    headline: 'Overcoming hurdles',
    summary: 'From daily calls to the mayor to navigating a dozen obstacles, our clients from Turkey secured their dream home.',
    url: 'https://www.facebook.com/photo/?fbid=719423324040360&set=a.188236427159055',
    image: '/testimonials/overcoming-hurdles.png',
  },
  {
    id: 't6',
    headline: 'Investment success',
    summary: 'Congratulations on securing a beautiful investment apartment. Another happy client moved forward.',
    url: 'https://www.facebook.com/photo/?fbid=711247738191252&set=a.188236427159055',
    image: '/testimonials/investment-success.png',
  },
  {
    id: 't7',
    headline: 'Resilience in property',
    summary: "We navigated the seller's bankruptcy and other unexpected hurdles. Finally crossed the finish line.",
    url: 'https://www.facebook.com/photo/?fbid=693770526605640&set=a.188236427159055',
    image: '/testimonials/resilience-in-property.png',
  },
]

function StoryCard({ headline, summary, url, image }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border/60 bg-white overflow-hidden transition-all duration-200 hover:border-border-strong hover:shadow-sm"
    >
      {image && (
        <div className="aspect-[4/3] overflow-hidden bg-surface">
          <img
            src={image}
            alt={headline}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4 sm:p-5">
        <p className="font-display text-[14px] font-bold text-ink leading-snug mb-1.5 group-hover:text-dark-700">
          {headline}
        </p>
        <p className="text-[12px] text-ink-muted leading-relaxed mb-3 line-clamp-2">
          {summary}
        </p>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium transition-colors" style={{ color: '#C9A96E' }}>
          Read story
          <ArrowUpRight size={11} />
        </span>
      </div>
    </a>
  )
}

export default function ClientStories() {
  const scrollRef = useRef(null)
  const sectionRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const getCardStep = () => {
    const el = scrollRef.current
    if (!el) return 300
    const card = el.querySelector('[data-story-card]')
    return card ? card.offsetWidth + 16 : 300
  }

  const scrollByDir = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * getCardStep(), behavior: 'smooth' })
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      setCanPrev(el.scrollLeft > 10)
      setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    carouselRegistry.set('client-stories', {
      scrollPrev: () => scrollByDir(-1),
      scrollNext: () => scrollByDir(1),
      canScrollPrev: () => (scrollRef.current?.scrollLeft ?? 0) > 10,
      canScrollNext: () => {
        const el = scrollRef.current
        return el ? el.scrollLeft < el.scrollWidth - el.clientWidth - 10 : false
      },
      getElement: () => sectionRef.current,
    })
    return () => carouselRegistry.delete('client-stories')
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-20 bg-surface"
      aria-label="Client stories"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#C9A96E' }}>
            Client outcomes
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Real mortgage cases in Czechia
          </h2>
          <p className="text-sm text-ink-muted mt-1">
            Expats and business owners who successfully navigated the process.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {canPrev && (
            <button
              onClick={() => scrollByDir(-1)}
              aria-label="Previous story"
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full items-center justify-center bg-white border border-border shadow-sm text-ink-muted hover:text-ink transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                data-story-card=""
                className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start"
              >
                <StoryCard {...t} />
              </div>
            ))}
            <div className="flex-shrink-0 w-4" aria-hidden="true" />
          </div>

          {canNext && (
            <button
              onClick={() => scrollByDir(1)}
              aria-label="Next story"
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full items-center justify-center bg-white border border-border shadow-sm text-ink-muted hover:text-ink transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

      </div>
    </section>
  )
}
