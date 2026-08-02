import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Play, ExternalLink } from 'lucide-react'
import { carouselRegistry } from '../../hooks/carouselRegistry.js'
import { VIDEO_LIBRARY, TOPIC_LABELS } from '../../data/videoLibrary.js'

const VIDEOS = VIDEO_LIBRARY.filter(v => v.available)

const VideoCard = React.memo(function VideoCard({ video }) {
  const [playing, setPlaying] = useState(false)
  const topicLabel = video.topics?.[0]
    ? TOPIC_LABELS[video.topics[0]] || video.topics[0]
    : null

  return (
    <div className="group block rounded-xl border border-border/60 bg-white overflow-hidden transition-all duration-200 hover:border-border-strong hover:shadow-md">
      {/* Poster / Player area */}
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="relative w-full aspect-video bg-dark-900 focus:outline-none focus:ring-2 focus:ring-bronze/40"
        aria-label={`Play video: ${video.title}`}
      >
        {playing ? (
          <iframe
            src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.facebookUrl)}&show_text=false`}
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            title={video.title}
          />
        ) : (
          <>
            {/* Branded poster */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a2332] to-[#0F172A] flex flex-col items-center justify-center px-4">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: 0.05,
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              {topicLabel && (
                <span className="relative z-10 mb-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10" style={{ color: '#C9A96E' }}>
                  {topicLabel}
                </span>
              )}
              <p className="relative z-10 font-display text-[13px] font-bold text-white text-center leading-snug max-w-[180px]">
                {video.title}
              </p>
            </div>
            {/* Play button */}
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
                <Play size={16} className="text-dark-900 ml-0.5" fill="#0F172A" />
              </div>
            </div>
            {/* Duration */}
            {video.duration && (
              <span className="absolute bottom-2 right-2 z-20 text-[10px] text-white/80 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">
                {video.duration}
              </span>
            )}
          </>
        )}
      </button>

      {/* Content */}
      <div className="p-3.5">
        <p className="text-[13px] font-semibold text-ink leading-snug mb-1 line-clamp-2">
          {video.title}
        </p>
        <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-2">
          {video.description}
        </p>
        <a
          href={video.facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium hover:underline min-h-[44px]"
          style={{ color: '#C9A96E' }}
        >
          <ExternalLink size={10} />
          Watch on Facebook
        </a>
      </div>
    </div>
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
            Expert guidance
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Mortgage insights library
          </h2>
          <p className="text-sm text-ink-muted mt-1 max-w-lg">
            Short expert videos on Czech mortgage topics — from pre-approval to property handover.
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
                <VideoCard video={v} />
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
