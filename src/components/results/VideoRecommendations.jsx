import { useState } from 'react'
import { Play, ExternalLink } from 'lucide-react'
import { recommendVideos } from '../../utils/videoRecommender.js'
import { VIDEO_LIBRARY, TOPIC_LABELS } from '../../data/videoLibrary.js'

function BrandedPoster({ video }) {
  const topicLabel = video.topics?.[0]
    ? TOPIC_LABELS[video.topics[0]] || video.topics[0]
    : null

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#1a2332] to-[#0F172A] flex flex-col items-center justify-center px-6">
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
        <span className="relative z-10 mb-3 px-3 py-1 rounded-full text-[11px] font-medium text-bronze bg-white/10">
          {topicLabel}
        </span>
      )}
      <p className="relative z-10 font-display text-[14px] font-bold text-white text-center leading-snug max-w-[200px]">
        {video.title}
      </p>
    </div>
  )
}

function VideoPoster({ video, loading = 'lazy' }) {
  const [imgFailed, setImgFailed] = useState(false)

  if (!video.posterImage || imgFailed) {
    return <BrandedPoster video={video} />
  }

  return (
    <img
      src={video.posterImage}
      alt={video.posterAlt || video.title}
      loading={loading}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setImgFailed(true)}
    />
  )
}

/**
 * Play button overlay centered in the poster area.
 */
function PlayOverlay({ size = 48 }) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
    >
      <div
        className="flex items-center justify-center rounded-full bg-white/90 shadow-lg"
        style={{ width: size, height: size }}
      >
        <Play size={size * 0.4} className="text-dark-900 ml-0.5" fill="#0F172A" />
      </div>
    </div>
  )
}

/**
 * Duration badge in the bottom-right of the poster area.
 */
function DurationBadge({ duration }) {
  if (!duration) return null
  return (
    <span className="absolute bottom-2 right-2 z-20 px-2 py-0.5 rounded text-[10px] font-medium text-white bg-black/60 backdrop-blur-sm">
      {duration}
    </span>
  )
}

/**
 * Facebook video embed iframe.
 */
function FacebookEmbed({ video }) {
  const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.facebookUrl)}&show_text=false`

  return (
    <iframe
      src={src}
      className="absolute inset-0 w-full h-full"
      style={{ border: 'none' }}
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
      title={video.title}
    />
  )
}

/**
 * Primary (large) video card.
 */
function PrimaryVideoCard({ video, playingId, onPlay }) {
  const isPlaying = playingId === video.id

  return (
    <div className="mb-5">
      {/* Poster / Player area */}
      <button
        type="button"
        onClick={() => onPlay(video.id)}
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-dark-900 focus:outline-none focus:ring-2 focus:ring-bronze/40 min-h-[44px]"
        aria-label={`Play video: ${video.title}`}
      >
        {isPlaying ? (
          <FacebookEmbed video={video} />
        ) : (
          <>
            <VideoPoster video={video} loading="eager" />
            <PlayOverlay size={56} />
            <DurationBadge duration={video.duration} />
          </>
        )}
      </button>

      {/* Meta below poster */}
      <div className="mt-3 px-1">
        <h4 className="font-display text-[15px] font-bold text-ink leading-snug">
          {video.title}
        </h4>
        {video.reason && (
          <p className="text-[12px] text-ink-muted italic leading-relaxed mt-1">
            {video.reason}
          </p>
        )}
        <a
          href={video.facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-2 text-[12px] text-bronze font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-bronze/40 rounded min-h-[44px]"
        >
          <ExternalLink size={12} />
          Watch on Facebook
        </a>
      </div>
    </div>
  )
}

/**
 * Secondary (compact) video card — horizontal layout on mobile.
 */
function SecondaryVideoCard({ video, playingId, onPlay }) {
  const isPlaying = playingId === video.id

  return (
    <div className="flex gap-3 items-start">
      {/* Thumbnail area */}
      <button
        type="button"
        onClick={() => onPlay(video.id)}
        className="relative flex-shrink-0 w-[120px] h-[80px] rounded-lg overflow-hidden bg-dark-900 focus:outline-none focus:ring-2 focus:ring-bronze/40 min-h-[44px]"
        aria-label={`Play video: ${video.title}`}
      >
        {isPlaying ? (
          <FacebookEmbed video={video} />
        ) : (
          <>
            <VideoPoster video={video} />
            <PlayOverlay size={32} />
          </>
        )}
      </button>

      {/* Text */}
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="font-display text-[13px] font-bold text-ink leading-snug line-clamp-2">
          {video.title}
        </h4>
        {video.reason && (
          <p className="text-[11px] text-ink-muted italic leading-relaxed mt-1 line-clamp-2">
            {video.reason}
          </p>
        )}
        <a
          href={video.facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-1 text-[11px] text-bronze font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-bronze/40 rounded min-h-[44px]"
        >
          <ExternalLink size={10} />
          Watch on Facebook
        </a>
      </div>
    </div>
  )
}

/**
 * Grid card used in the "Explore all" expanded view.
 */
function GridVideoCard({ video, playingId, onPlay }) {
  const isPlaying = playingId === video.id

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => onPlay(video.id)}
        className="relative w-full aspect-video rounded-lg overflow-hidden bg-dark-900 focus:outline-none focus:ring-2 focus:ring-bronze/40 min-h-[44px]"
        aria-label={`Play video: ${video.title}`}
      >
        {isPlaying ? (
          <FacebookEmbed video={video} />
        ) : (
          <>
            <VideoPoster video={video} />
            <PlayOverlay size={36} />
            <DurationBadge duration={video.duration} />
          </>
        )}
      </button>
      <h4 className="font-display text-[12px] font-bold text-ink leading-snug mt-2 line-clamp-2">
        {video.title}
      </h4>
      <a
        href={video.facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-1 text-[11px] text-bronze font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-bronze/40 rounded min-h-[44px]"
      >
        <ExternalLink size={10} />
        Watch on Facebook
      </a>
    </div>
  )
}

/**
 * VideoRecommendations — personalized video section for the results page.
 *
 * @param {{ formData: object, profile: object, score: number }} props
 */
export default function VideoRecommendations({ formData, profile, score }) {
  const [playingId, setPlayingId] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const result = recommendVideos(formData, profile, score)

  if (!result || !result.primary) return null

  const primaryVideo = { ...result.primary.video, reason: result.primary.reason }
  const secondaryVideos = (result.secondary || []).map(s => ({ ...s.video, reason: s.reason }))

  const handlePlay = (id) => {
    setPlayingId((prev) => (prev === id ? null : id))
  }

  const recommendedIds = new Set([
    primaryVideo.id,
    ...secondaryVideos.map((v) => v.id),
  ])
  const allVideos = VIDEO_LIBRARY.filter((v) => v.available)

  return (
    <section
      role="region"
      aria-label="Personalized video recommendations"
      className="rounded-2xl border border-border bg-card shadow-card p-5 mt-8 overflow-hidden"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-bronze mb-4">
        Selected for your situation
      </p>

      <PrimaryVideoCard
        video={primaryVideo}
        playingId={playingId}
        onPlay={handlePlay}
      />

      {secondaryVideos.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-medium text-ink-subtle uppercase tracking-wide mb-3">
            You may also find useful
          </p>
          <div className="space-y-4">
            {secondaryVideos.slice(0, 2).map((video) => (
              <SecondaryVideoCard
                key={video.id}
                video={video}
                playingId={playingId}
                onPlay={handlePlay}
              />
            ))}
          </div>
        </div>
      )}

      {!showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-6 text-[13px] font-medium text-bronze underline underline-offset-2 hover:text-ink focus:outline-none focus:ring-2 focus:ring-bronze/40 rounded min-h-[44px] flex items-center"
        >
          Explore all mortgage insights
        </button>
      )}

      {showAll && (
        <div className="mt-6 pt-5 border-t border-border">
          <p className="text-[11px] font-medium text-ink-subtle uppercase tracking-wide mb-4">
            All mortgage insights
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allVideos
              .filter((v) => !recommendedIds.has(v.id))
              .map((video) => (
                <GridVideoCard
                  key={video.id}
                  video={video}
                  playingId={playingId}
                  onPlay={handlePlay}
                />
              ))}
          </div>
        </div>
      )}
    </section>
  )
}
