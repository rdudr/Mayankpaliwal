import Bins from './Bins'
import { SectionHead } from './ui'

/** Page 3 — opaque, so the 3D camera can cut to the contact scene while it covers the screen. */
export default function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="relative min-h-full bg-cream pb-20 pt-24 md:pt-32">
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
