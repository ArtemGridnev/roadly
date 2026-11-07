import { useDndContext } from '@dnd-kit/core'
import { useEffect } from 'react'

const EDGE_RATIO = 0.2
const PIXELS_PER_FRAME = 12

// dnd-kit's auto-scroll treats scrollLeft <= 0 as the left end, but in RTL scrollLeft is negative,
// so it never scrolls toward the later columns. Rendered only while dragging.
export function RtlAutoScroller() {
  const container = useDndContext().scrollableAncestors[0]

  useEffect(() => {
    if (!container) {
      return
    }

    let pointerX: number | null = null
    const trackMouse = (event: MouseEvent) => {
      pointerX = event.clientX
    }
    const trackTouch = (event: TouchEvent) => {
      pointerX = event.touches[0].clientX
    }

    let frame = requestAnimationFrame(function scroll() {
      const { left, right, width } = container.getBoundingClientRect()

      if (pointerX !== null && pointerX < left + width * EDGE_RATIO) {
        container.scrollLeft -= PIXELS_PER_FRAME
      } else if (pointerX !== null && pointerX > right - width * EDGE_RATIO) {
        container.scrollLeft += PIXELS_PER_FRAME
      }

      frame = requestAnimationFrame(scroll)
    })

    window.addEventListener('mousemove', trackMouse)
    window.addEventListener('touchmove', trackTouch)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', trackMouse)
      window.removeEventListener('touchmove', trackTouch)
    }
  }, [container])

  return null
}
