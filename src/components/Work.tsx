import Bins from './Bins'
import { SectionHead } from './ui'

/** Page 3 — opaque, so the 3D camera can cut to the contact scene behind it. */
export default function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="relative z-10 min-h-[170svh] bg-cream pb-28 pt-28 md:pt-36">
      {/* soft edge where the blue lab hands over */}
      <div aria-hidden className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-cream" />
      <div className="content-width">
        <SectionHead
          kicker="My work"
          title={<span id="work-title">The bins</span>}
          intro="Every client gets a bin. Open one to fan out what's inside."
        />
        <Bins />
      </div>
    </section>
  )
}
