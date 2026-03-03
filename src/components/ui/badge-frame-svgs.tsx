'use client'

interface SvgOverlayProps {
  className?: string
}

/** Small crown SVG — positioned at top-center of avatar */
export function GoldCrown({ className }: SvgOverlayProps) {
  return (
    <svg
      viewBox="0 0 24 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 14L4 4L8 8L12 2L16 8L20 4L22 14H2Z"
        fill="#EAB308"
        stroke="#CA8A04"
        strokeWidth="1"
      />
      <circle cx="4" cy="4" r="1.5" fill="#FACC15" />
      <circle cx="12" cy="2" r="1.5" fill="#FACC15" />
      <circle cx="20" cy="4" r="1.5" fill="#FACC15" />
    </svg>
  )
}

/** Small sparkle SVG — positioned at top-right of avatar */
export function DiamondSparkle({ className }: SvgOverlayProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M10 0L12 7L20 10L12 13L10 20L8 13L0 10L8 7L10 0Z"
        fill="#67E8F9"
        stroke="#22D3EE"
        strokeWidth="0.5"
      />
      <path
        d="M16 2L17 5L20 6L17 7L16 10L15 7L12 6L15 5L16 2Z"
        fill="#A5F3FC"
        opacity="0.7"
      />
    </svg>
  )
}

/** Small flame SVG — positioned at bottom-center of avatar */
export function FireFlame({ className }: SvgOverlayProps) {
  return (
    <svg
      viewBox="0 0 20 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M10 0C10 0 4 8 4 14C4 18 6.5 22 10 24C13.5 22 16 18 16 14C16 8 10 0 10 0Z"
        fill="#F97316"
      />
      <path
        d="M10 6C10 6 7 11 7 15C7 18 8.5 20 10 22C11.5 20 13 18 13 15C13 11 10 6 10 6Z"
        fill="#FACC15"
      />
      <path
        d="M10 12C10 12 8.5 14 8.5 16C8.5 18 9.5 19 10 20C10.5 19 11.5 18 11.5 16C11.5 14 10 12 10 12Z"
        fill="#FEF08A"
      />
    </svg>
  )
}
