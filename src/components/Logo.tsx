import { motion } from 'framer-motion'

/** Clapperboard mark: the slate's stripes, a play button, and an orange playhead. */
export default function Logo({ size = 48, clap = 0, className }: { size?: number; clap?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      {/* body */}
      <rect x="5" y="17" width="38" height="26" rx="6" fill="#091434" />
      <path d="M21 24.5v11l9-5.5z" fill="#fff" />
      <rect x="35.5" y="21" width="2.4" height="18" rx="1.2" fill="#ff923e" />
      {/* hinged slate arm */}
      <motion.g style={{ originX: '7px', originY: '15px' }} animate={{ rotate: -18 + clap * 18 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }}>
        <rect x="5" y="8" width="38" height="8" rx="2.5" fill="#091434" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${12 + i * 8.5} 8h4.5l-4 8h-4.5z`} fill="#fff" />
        ))}
      </motion.g>
    </svg>
  )
}
