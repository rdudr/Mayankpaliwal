// The site as a Premiere sequence: each section is a clip on V1, and each cut
// into it is a named edit transition.
export const sequence = [
  { id: 'hero', label: 'Opening', clip: 'A001_OPEN', transition: 'Letterbox open' },
  { id: 'proof', label: 'Proof', clip: 'A002_PROOF', transition: 'Hard cut' },
  { id: 'work', label: 'Selected work', clip: 'A003_WORK', transition: 'Match cut' },
  { id: 'bins', label: 'Bins', clip: 'A004_BINS', transition: 'Cross dissolve' },
  { id: 'timeline', label: 'Career', clip: 'A005_CAREER', transition: 'Whip pan' },
  { id: 'grade', label: 'Before / after', clip: 'A006_GRADE', transition: 'J-cut' },
  { id: 'stills', label: 'Stills', clip: 'A007_STILLS', transition: 'Dip to black' },
  { id: 'export', label: 'Contact', clip: 'A008_EXPORT', transition: 'Fade out' },
] as const

export type SectionId = (typeof sequence)[number]['id']
