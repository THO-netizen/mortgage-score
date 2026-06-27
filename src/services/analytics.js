/**
 * FunnelAnalytics — mock tracking service.
 * Logs structured events to the console and simulates
 * Meta Pixel + Google Analytics calls for retargeting readiness.
 */
class FunnelAnalytics {
  constructor() {
    this.events   = []
    this.sessionId = 'sess_' + Math.random().toString(36).slice(2, 11)
    this.t0        = Date.now()
  }

  track(name, props = {}) {
    const event = {
      name,
      sessionId: this.sessionId,
      ts:        new Date().toISOString(),
      elapsed:   Math.round((Date.now() - this.t0) / 1000) + 's',
      ...props,
    }
    this.events.push(event)

    // Structured console output
    console.group(`%c[FunnelAnalytics] ${name}`, 'color:#2563EB;font-weight:700;font-size:12px')
    console.log('Props:',   props)
    console.log('Session:', this.sessionId)
    console.log('Elapsed:', event.elapsed)
    console.groupEnd()

    // Mock Meta Pixel
    console.log(
      `%c[Meta Pixel]  fbq("track", "${name}")`,
      'color:#1877f2;font-size:11px',
      props,
    )
    // Mock Google Analytics
    console.log(
      `%c[Google Analytics]  gtag("event", "${name}")`,
      'color:#ea4335;font-size:11px',
      props,
    )
  }

  getEvents()  { return [...this.events] }
  getSession() { return this.sessionId   }
}

// Single shared instance for the session lifetime
export const analytics = new FunnelAnalytics()
