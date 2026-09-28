import { useEffect, useState } from 'react'
import { beforeAfter, showStills } from './content/site'
import BeforeAfter from './components/BeforeAfter'
import Bins from './components/Bins'
import { Header, MiniTimeline } from './components/Chrome'
import Credits from './components/Credits'
import Export from './components/Export'
import Hero from './components/Hero'
import Loader, { loaderMode } from './components/Loader'
import { ProjectProvider } from './components/ProjectModal'
import Proof from './components/Proof'
import { ReelProvider } from './components/Reel'
import Stills from './components/Stills'
import Timeline from './components/Timeline'
import Work from './components/Work'
import { useReducedMotion } from './lib/hooks'
import { ScrollTrigger, startSmoothScroll } from './lib/scroll'

const initialMode = loaderMode()

export default function App() {
  const reduced = useReducedMotion()
  const [ready, setReady] = useState(initialMode === 'none')

  useEffect(() => startSmoothScroll(reduced), [reduced])

  // Media and fonts change section heights — re-measure pinned sections once they settle.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    addEventListener('load', refresh)
    return () => removeEventListener('load', refresh)
  }, [])

  return (
    <ReelProvider>
      <ProjectProvider>
        <a href="#work" className="skip-link">Skip to work</a>
        {initialMode !== 'none' && !ready && <Loader mode={initialMode} onDone={() => setReady(true)} />}
        <Header />
        <main>
          <Hero ready={ready} />
          <Proof />
          <Work />
          <Bins />
          <Timeline />
          {beforeAfter.enabled && <BeforeAfter />}
          {showStills && <Stills />}
          <Export />
        </main>
        <Credits />
        <MiniTimeline />
        <div className="grain" aria-hidden />
      </ProjectProvider>
    </ReelProvider>
  )
}
