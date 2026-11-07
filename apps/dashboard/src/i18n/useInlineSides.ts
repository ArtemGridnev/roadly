import { Direction } from 'radix-ui'

// Radix `side` props and the sidebar and sheet variants are physical, so they need flipping by hand.
export function useInlineSides() {
  return Direction.useDirection() === 'rtl'
    ? ({ start: 'right', end: 'left' } as const)
    : ({ start: 'left', end: 'right' } as const)
}
