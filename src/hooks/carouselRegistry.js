/**
 * Lightweight singleton registry for keyboard-navigable carousels.
 * Each carousel registers itself on mount and unregisters on unmount.
 *
 * Entry shape:
 *   scrollPrev    : () => void
 *   scrollNext    : () => void
 *   canScrollPrev : () => boolean
 *   canScrollNext : () => boolean
 *   getElement    : () => HTMLElement | null   — read at call time to avoid stale refs
 */
export const carouselRegistry = new Map()
