import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { carouselRegistry } from '../../hooks/carouselRegistry.js'

const VIDEOS = [
  {
    id: '3043071172518775',
    title: 'Escrow: Protect Your Money',
    desc: 'How escrow protects buyers and sellers during a Czech property transaction.',
    category: 'process',
  },
  {
    id: '1154782076481763',
    title: 'Never Sign Before Pre-Approval',
    desc: 'Getting pre-approved can save you from losing your reservation deposit.',
    category: 'strategy',
  },
  {
    id: '637035798952912',
    title: 'Personal Ownership vs Cooperative',
    desc: 'Not every apartment can be financed with a mortgage.',
    category: 'property',
  },
  {
    id: '1100785461993862',
    title: 'Bank Valuation Can Change Everything',
    desc: 'Banks lend based on their own valuation, not the purchase price.',
    category: 'financing',
  },
  {
    id: '24632646016359230',
    title: 'Why Two People Get Different Rates',
    desc: 'What influences the rate you receive from the same bank.',
    category: 'financing',
  },
  {
    id: '1339104001172260',
    title: 'How Much Mortgage Can You Get?',
    desc: 'The basic rule banks use for estimating borrowing capacity.',
    category: 'capacity',
  },
  {
    id: '2586878941676335',
    title: 'Repay Your Mortgage Faster',
    desc: 'Czech law allows 25% annual repayment without penalties.',
    category: 'strategy',
  },
  {
    id: '1150390016931385',
    title: '1% Rate Difference = Over 1M CZK',
    desc: 'Why choosing the right lender matters long-term.',
    category: 'financing',
  },
  {
    id: '2953344864850635',
    title: 'Know Your Budget Before Hunting',
    desc: 'Start with your mortgage capacity, not property listings.',
    category: 'capacity',
  },
  {
    id: '1577214269933680',
    title: 'Why Was Your Mortgage Rejected?',
    desc: 'How DSTI, DTI and bank methodology change outcomes.',
    category: 'capacity',
  },
]

const VideoCard = React.memo(function VideoCard({ id, title, desc }) {
  const reelUrl = `https://www.facebook.com/reel/${id}/`

  return (
    <a
      href={reelUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border/60 bg-white overflow-hidden transition-all duration-200 hover:border-border-strong hover:shadow-md"
      aria-label={`Watch: ${title}`}
    >
      {/* Thumbnail area with play button */}
      <div className="relative aspect-video bg-dark-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-dark-900" />
        <div className="relative w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center transition-all duration-200 group-hover:bg-white/20 group-hover:scale-110">
          <Play size={18} className="text-white ml-0.5" fill="currentColor" />
        </div>
        <span className="absolute bottom-2 right-2 text-[10px] text-white/60 bg-black/40 px-1.5 py-0.5 rounded">
          Video
        </span>
      </div>
      {/* Content */}
      <div className="p-3.5">
        <p className="text-[13px] font-semibold text-ink leading-snug mb-1 line-clamp-2 group-hover:text-dark-700">
          {title}
        </p>
        <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-2">
          {desc}
        </p>
      </div>
    </a>
  )
})

export default function MortgageTipsLibrary() {
  const sectionRef = useRef(null)
  const scrollRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const syncState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 10)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', syncState, { passive: true })
    syncState()
    return () => el.removeEventListener('scroll', syncState)
  }, [syncState])

  const scrollBy = (dir) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector('[data-video-card]')
    const step = card ? card.offsetWidth + 16 : 300
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  useEffect(() => {
    carouselRegistry.set('mortgage-tips', {
      scrollPrev: () => scrollBy(-1),
      scrollNext: () => scrollBy(1),
      canScrollPrev: () => (scrollRef.current?.scrollLeft ?? 0) > 10,
      canScrollNext: () => {
        const el = scrollRef.current
        return el ? el.scrollLeft < el.scrollWidth - el.clientWidth - 10 : false
      },
      getElement: () => sectionRef.current,
    })
    return () => carouselRegistry.delete('mortgage-tips')
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-20"
      style={{ background: '#FAFAF8' }}
      aria-label="Mortgage guidance videos"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#C9A96E' }}>
            Selected guidance
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Videos for your situation
          </h2>
          <p className="text-sm text-ink-muted mt-1 max-w-lg">
            Short expert videos on Czech mortgage topics relevant to your assessment.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Prev */}
          {canPrev && (
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Previous videos"
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full items-center justify-center bg-white border border-border shadow-sm text-ink-muted hover:text-ink transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Track */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <style>{`[data-video-track]::-webkit-scrollbar { display: none; }`}</style>
            {VIDEOS.map((v) => (
              <div
                key={v.id}
                data-video-card=""
                className="flex-shrink-0 w-[260px] sm:w-[280px] snap-start"
              >
                <VideoCard {...v} />
              </div>
            ))}
            <div className="flex-shrink-0 w-4" aria-hidden="true" />
          </div>

          {/* Next */}
          {canNext && (
            <button
              onClick={() => scrollBy(1)}
              aria-label="Next videos"
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
