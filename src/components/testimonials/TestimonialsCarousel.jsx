import React, { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { carouselRegistry } from '../../hooks/carouselRegistry.js'

const VIDEOS = [
  {
    id: '3043071172518775',
    title: 'Escrow: Protect Your Money',
    desc: 'Learn how escrow protects both buyers and sellers during a property transaction and helps you avoid unnecessary stress, fraud, or losing your money.',
  },
  {
    id: '2013647709171522',
    title: 'English Isn\'t Always Enough',
    desc: 'Many people assume English is enough when buying property in the Czech Republic. Learn why language barriers can still create expensive misunderstandings.',
  },
  {
    id: '3893330600957610',
    title: 'Married? Czech Property Law May Surprise You',
    desc: 'Even if only one spouse signs the purchase contract, Czech law may consider the property jointly owned. Understand how this affects future selling, refinancing, or divorce.',
  },
  {
    id: '1154782076481763',
    title: 'Never Sign Before Mortgage Pre-Approval',
    desc: 'Found your dream apartment? Getting pre-approved before signing can save you from losing your reservation deposit if the bank declines your mortgage.',
  },
  {
    id: '637035798952912',
    title: 'Personal Ownership vs Cooperative Housing',
    desc: 'Not every apartment can be financed with a mortgage. Learn the key differences between private ownership (OV) and cooperative housing (DV).',
  },
  {
    id: '3505855822878034',
    title: 'Property Viewing Checklist',
    desc: 'Before making an offer, make sure you know exactly what to inspect. A few overlooked details can cost hundreds of thousands later.',
  },
  {
    id: '1366161228843604',
    title: 'Over 36? You May Still Need Only 10% Down',
    desc: 'Buying with a younger partner may allow you to qualify for a 90% mortgage, even if you\'re over 36. Learn how the LTV rules actually work.',
  },
  {
    id: '1100785461993862',
    title: 'Bank Valuation Can Change Everything',
    desc: 'Banks lend based on their own valuation — not the agreed purchase price. Understand how this can affect your required down payment.',
  },
  {
    id: '24632646016359230',
    title: 'Why Two People Get Different Mortgage Rates',
    desc: 'Even at the same bank, mortgage rates depend on your financial profile. Learn what influences the rate you receive.',
  },
  {
    id: '1260234258673232',
    title: 'Hidden Easements Explained',
    desc: 'An easement can give someone else legal rights over your property. Always check the Land Registry before buying.',
  },
  {
    id: '750724387722459',
    title: 'How to Negotiate a Better Property Price',
    desc: 'Simple negotiation strategies that can help you save thousands when buying a property.',
  },
  {
    id: '1945799819553534',
    title: 'Mortgage Pre-Approval Gives You an Advantage',
    desc: 'A pre-approved mortgage lets you negotiate like a cash buyer — but missing important deadlines can become expensive.',
  },
  {
    id: '2586878941676335',
    title: 'Repay Your Mortgage Faster — for Free',
    desc: 'Czech law allows you to repay up to 25% of your mortgage each year without penalties. Learn how this can save years of repayments.',
  },
  {
    id: '1150390016931385',
    title: 'A 1% Rate Difference Can Cost Over 1 Million CZK',
    desc: 'Small interest rate differences have a huge long-term impact. Learn why choosing the right lender matters.',
  },
  {
    id: '1339104001172260',
    title: 'How Much Mortgage Can You Get?',
    desc: 'Discover the basic rule banks use when estimating borrowing capacity — and why income and existing debts matter.',
  },
  {
    id: '24294507180244451',
    title: 'Only 10% Down for Couples',
    desc: 'If one partner is under 36, many couples can qualify for a mortgage with only a 10% down payment.',
  },
  {
    id: '1551599372494437',
    title: 'Ask These 3 Questions Before Signing',
    desc: 'Before accepting any mortgage offer, make sure you ask these three essential questions.',
  },
  {
    id: '743326638737121',
    title: 'Rent vs Buying',
    desc: 'Every rent payment builds someone else\'s wealth. See when buying property may become the smarter financial decision.',
  },
  {
    id: '2953344864850635',
    title: 'Know Your Budget Before House Hunting',
    desc: 'Don\'t fall in love with a property before knowing what the bank will actually lend you. Start with your mortgage capacity.',
  },
  {
    id: '1577214269933680',
    title: 'Why Was Your Mortgage Rejected?',
    desc: 'Mortgage approval isn\'t only about income. Learn how DSTI, DTI and each bank\'s internal methodology can completely change the outcome.',
  },
]

// Gradient presets cycled across cards for visual variety
const CARD_GRADIENTS = [
  'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #3B82F6 100%)',
  'linear-gradient(135deg, #0F172A 0%, #1E40AF 100%)',
  'linear-gradient(135deg, #1E293B 0%, #2563EB 100%)',
  'linear-gradient(135deg, #1E3A8A 0%, #334155 50%, #1D4ED8 100%)',
  'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #3B82F6 100%)',
]

// ── VideoThumbnailCard ────────────────────────────────────────────────────────
const VideoThumbnailCard = React.memo(function VideoThumbnailCard({ id, title, index }) {
  const reelUrl = `https://www.facebook.com/reel/${id}/`
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]

  const handleClick = () => {
    window.open(reelUrl, '_blank', 'noopener,noreferrer')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Watch: ${title} — opens Facebook in a new tab`}
      className="group relative w-full rounded-xl overflow-hidden border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
      style={{ aspectRatio: '9 / 16' }}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{ background: gradient }}
      />

      {/* Subtle pattern overlay for depth */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3)_0%,transparent_50%)]" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-200 group-hover:bg-white/25 group-hover:scale-110 group-focus-visible:bg-white/25 group-focus-visible:scale-110">
          <Play
            size={28}
            className="text-white ml-1 drop-shadow-lg"
            fill="currentColor"
          />
        </div>
      </div>

      {/* Title overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
        <p className="text-white text-sm font-semibold leading-snug text-left drop-shadow-md">
          {title}
        </p>
        <p className="text-white/60 text-[11px] mt-1 text-left">
          Watch on Facebook
        </p>
      </div>
    </button>
  )
})

// ── MortgageTipsLibrary ───────────────────────────────────────────────────────
export default function MortgageTipsLibrary() {
  const sectionRef = useRef(null)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    dragFree: false,
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 4 },
    },
  })

  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const syncState = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    syncState()
    emblaApi.on('select', syncState)
    emblaApi.on('reInit', syncState)
    return () => {
      emblaApi.off('select', syncState)
      emblaApi.off('reInit', syncState)
    }
  }, [emblaApi, syncState])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi])

  // ── Keyboard registry ─────────────────────────────────────────────────────
  useEffect(() => {
    carouselRegistry.set('mortgage-tips', {
      scrollPrev,
      scrollNext,
      canScrollPrev: () => emblaApi?.canScrollPrev() ?? false,
      canScrollNext: () => emblaApi?.canScrollNext() ?? false,
      getElement: () => sectionRef.current,
    })
    return () => carouselRegistry.delete('mortgage-tips')
  }, [emblaApi, scrollPrev, scrollNext])

  // ── Touchpad / horizontal mousewheel support ──────────────────────────────
  useEffect(() => {
    const viewport = sectionRef.current?.querySelector('[data-embla-viewport]')
    if (!viewport || !emblaApi) return

    let accumulated = 0
    let rafId

    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()

      accumulated += e.deltaX
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        if (accumulated > 40) {
          emblaApi.scrollNext()
          accumulated = 0
        } else if (accumulated < -40) {
          emblaApi.scrollPrev()
          accumulated = 0
        }
      })
    }

    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      viewport.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(rafId)
    }
  }, [emblaApi])

  // ── Keyboard handler (direct focus on section) ────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollPrev() }
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollNext() }
  }

  const snapCount = emblaApi ? emblaApi.scrollSnapList().length : VIDEOS.length

  return (
    <section
      ref={sectionRef}
      className="bg-dark-900 py-20 overflow-hidden"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Mortgage Tips carousel — use arrow keys to navigate"
      style={{ outline: 'none' }}
    >
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
            Free expert videos to help you understand Czech mortgages, improve your borrowing
            capacity, avoid common mistakes, and confidently navigate the entire home-buying process.
          </p>
        </div>

        {/* Carousel wrapper */}
        <div className="relative">

          {/* Prev arrow — hidden on mobile */}
          <button
            onClick={scrollPrev}
            disabled={!canPrev}
            aria-label="Previous videos"
            className={[
              'hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10',
              'w-9 h-9 rounded-full items-center justify-center',
              'bg-dark-800 border border-white/10 text-white transition-all duration-150',
              canPrev
                ? 'opacity-100 hover:bg-dark-700 hover:border-brand-500/40 cursor-pointer'
                : 'opacity-0 pointer-events-none',
            ].join(' ')}
          >
            <ChevronLeft size={17} />
          </button>

          {/* Embla viewport */}
          <div
            ref={emblaRef}
            data-embla-viewport=""
            className="overflow-hidden cursor-grab active:cursor-grabbing"
          >
            <div className="flex" style={{ marginLeft: '-12px' }}>
              {VIDEOS.map((v, i) => (
                <div
                  key={v.id}
                  className="flex-[0_0_83.333%] sm:flex-[0_0_40%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%] min-w-0"
                  style={{ paddingLeft: '12px' }}
                >
                  <VideoThumbnailCard
                    id={v.id}
                    title={v.title}
                    index={i}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Next arrow — hidden on mobile */}
          <button
            onClick={scrollNext}
            disabled={!canNext}
            aria-label="Next videos"
            className={[
              'hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10',
              'w-9 h-9 rounded-full items-center justify-center',
              'bg-dark-800 border border-white/10 text-white transition-all duration-150',
              canNext
                ? 'opacity-100 hover:bg-dark-700 hover:border-brand-500/40 cursor-pointer'
                : 'opacity-0 pointer-events-none',
            ].join(' ')}
          >
            <ChevronRight size={17} />
          </button>

        </div>

        {/* Dot navigation */}
        <div className="flex justify-center items-center gap-2 mt-6" role="tablist" aria-label="Carousel navigation">
          {Array.from({ length: snapCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              role="tab"
              aria-selected={i === selectedIndex}
              aria-label={`Go to slide group ${i + 1}`}
              className={[
                'rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                i === selectedIndex
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
