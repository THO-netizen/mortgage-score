import React, { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
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

// ── VideoCard ─────────────────────────────────────────────────────────────────
// Memoised so only the card whose isPlaying prop changes re-renders.
// Cross-origin iframes cannot be controlled via JS API, so we switch the `src`
// between a muted-autoplay URL and the static URL to start/stop playback.
const VideoCard = React.memo(function VideoCard({ id, title, desc, isPlaying }) {
  const reelUrl  = `https://www.facebook.com/reel/${id}/`
  const staticSrc  = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(reelUrl)}&show_text=false&width=500&mute=1`
  const autoplaySrc = staticSrc + '&autoplay=1'
  const embedSrc = isPlaying ? autoplaySrc : staticSrc

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-dark-800 overflow-hidden h-full">
      {/* 9:16 portrait iframe */}
      <div className="relative w-full flex-shrink-0" style={{ paddingBottom: '177.78%' }}>
        <iframe
          src={embedSrc}
          title={title}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          scrolling="no"
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            border: 'none', overflow: 'hidden',
          }}
        />
      </div>

      {/* Text content */}
      <div className="flex flex-col flex-1 p-4" style={{ minHeight: '112px' }}>
        <h3
          className="text-white font-semibold text-[13px] leading-snug mb-1.5"
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          {title}
        </h3>
        <p
          className="text-slate-400 text-[11px] leading-relaxed flex-1 mb-3"
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          {desc}
        </p>
        <a
          href={reelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-brand-400 text-[11px] font-semibold hover:text-brand-300 transition-colors mt-auto"
        >
          Watch Tip
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  )
})

// ── MortgageTipsLibrary ───────────────────────────────────────────────────────
export default function MortgageTipsLibrary() {
  const sectionRef     = useRef(null)   // the outer <section> element
  const emblaViewportEl = useRef(null)  // the overflow:hidden Embla viewport element
  // ratioMap stores the latest intersectionRatio for each video id (within the carousel viewport)
  const ratioMap = useRef(new Map())

  const [playingId,    setPlayingId]    = useState(null)   // id of the currently autoplaying card
  const [sectionInView, setSectionInView] = useState(false) // section gating flag

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    dragFree: false,
  })

  const [canPrev,       setCanPrev]       = useState(false)
  const [canNext,       setCanNext]       = useState(true)
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
  const scrollTo   = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi])

  // ── Keyboard registry ───────────────────────────────────────────────────────
  useEffect(() => {
    carouselRegistry.set('mortgage-tips', {
      scrollPrev,
      scrollNext,
      canScrollPrev: () => emblaApi?.canScrollPrev() ?? false,
      canScrollNext: () => emblaApi?.canScrollNext() ?? false,
      getElement:    () => sectionRef.current,
    })
    return () => carouselRegistry.delete('mortgage-tips')
  }, [emblaApi, scrollPrev, scrollNext])

  // ── Section visibility gate ─────────────────────────────────────────────────
  // Stops all playback when the section is not visible on the page.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        setSectionInView(entry.isIntersecting)
        if (!entry.isIntersecting) setPlayingId(null)
      },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // ── Card visibility observer (autoplay logic) ───────────────────────────────
  // Uses the Embla viewport as root so intersection ratios reflect how much of
  // each slide is visible *within the carousel*, not the page.
  // threshold: 0.6 means a card must be ≥60% visible in the carousel to qualify.
  // Among qualifying cards (ties common at desktop), the one whose horizontal
  // centre is closest to the carousel's centre wins.
  useEffect(() => {
    const viewport = emblaViewportEl.current
    if (!viewport || !emblaApi) return

    const obs = new IntersectionObserver(
      (entries) => {
        // Update ratio map with latest data for changed entries
        entries.forEach(entry => {
          const id = entry.target.dataset.videoId
          if (id) ratioMap.current.set(id, entry.intersectionRatio)
        })

        // Find the best candidate: highest ratio, tiebroken by proximity to carousel centre
        const viewportRect = viewport.getBoundingClientRect()
        const viewportCx   = viewportRect.left + viewportRect.width / 2

        let bestId    = null
        let bestScore = -Infinity

        ratioMap.current.forEach((ratio, id) => {
          if (ratio < 0.6) return
          const el = viewport.querySelector(`[data-video-id="${id}"]`)
          if (!el) return
          const rect     = el.getBoundingClientRect()
          const cardCx   = rect.left + rect.width / 2
          // score = ratio (0-1) minus normalised distance from centre (0-1)
          const dist     = Math.abs(cardCx - viewportCx) / (viewportRect.width || 1)
          const score    = ratio - dist
          if (score > bestScore) { bestScore = score; bestId = id }
        })

        setPlayingId(bestId)
      },
      { root: viewport, threshold: [0, 0.6, 1.0] },
    )

    // Observe every slide container (each has data-video-id)
    viewport.querySelectorAll('[data-video-id]').forEach(el => obs.observe(el))

    return () => obs.disconnect()
  }, [emblaApi]) // re-run when emblaApi is available (viewport element is ready)

  // ── Keyboard handler (direct focus on section) ──────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollPrev() }
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

          {/* Prev arrow */}
          <button
            onClick={scrollPrev}
            disabled={!canPrev}
            aria-label="Previous videos"
            className={[
              'hidden sm:flex absolute left-0 top-[46%] -translate-y-1/2 -translate-x-4 z-10',
              'w-9 h-9 rounded-full items-center justify-center',
              'bg-dark-800 border border-white/10 text-white transition-all duration-150',
              canPrev
                ? 'opacity-100 hover:bg-dark-700 hover:border-brand-500/40 cursor-pointer'
                : 'opacity-0 pointer-events-none',
            ].join(' ')}
          >
            <ChevronLeft size={17} />
          </button>

          {/* Embla viewport — dual ref: emblaRef for Embla + emblaViewportEl for IO root */}
          <div
            ref={(el) => { emblaRef(el); emblaViewportEl.current = el }}
            className="overflow-hidden cursor-grab active:cursor-grabbing"
          >
            <div className="flex" style={{ marginLeft: '-16px' }}>
              {VIDEOS.map((v) => (
                <div
                  key={v.id}
                  data-video-id={v.id}
                  className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0"
                  style={{ paddingLeft: '16px' }}
                >
                  <VideoCard
                    {...v}
                    isPlaying={v.id === playingId && sectionInView}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Next arrow */}
          <button
            onClick={scrollNext}
            disabled={!canNext}
            aria-label="Next videos"
            className={[
              'hidden sm:flex absolute right-0 top-[46%] -translate-y-1/2 translate-x-4 z-10',
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
        <div className="flex justify-center items-center gap-2 mt-6">
          {Array.from({ length: snapCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={[
                'rounded-full transition-all duration-300 focus:outline-none',
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
