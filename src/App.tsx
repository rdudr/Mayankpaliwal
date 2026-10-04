import { lazy, Suspense, useCallback, useState } from 'react'
import About from './components/About'
import Contact from './components/Contact'
import Home from './components/Home'
import Loader from './components/Loader'
import Nav from './components/Nav'
import { ProjectProvider } from './components/ProjectModal'
import { ReelProvider } from './components/Reel'
import Work from './components/Work'
import { useReducedMotion } from './lib/hooks'
import Pager from './components/Pager'
import { goTo } from './lib/pager'
import { backdrop, intro } from './scene/progress'

// three.js + the scenes load in their own chunk while the loader plays.
const Scene = lazy(() => import('./scene/Scene'))

export default function App() {
  const reduced = useReducedMotion()
  const [sceneReady, setSceneReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const onReady = useCallback(() => setSceneReady(true), [])

  return (
    <ReelProvider>
      <ProjectProvider>
        <button onClick={() => goTo('work')} className="skip-link">Skip to projects</button>
        {/* Backdrop behind the 3D canvas: lab blue (four-corner gradient, like the
            reference) with the cream home "sheet" on top that slides up during the fall. */}
        <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#000e2e,#004db3)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#002757,#009dff)] [mask-image:linear-gradient(to_right,transparent,black)]" />
          <div ref={(el) => (backdrop.sheet = el)} className="absolute inset-0 bg-cream will-change-transform" />
        </div>
        <Suspense fallback={null}>
          <Scene reduced={reduced} onReady={onReady} />
        </Suspense>
        {!entered && (
          <Loader
            ready={sceneReady}
            onDone={() => {
              intro.pending = true // he drops into his chair and waves
              setEntered(true)
            }}
          />
        )}
        <Nav />
        <main>
          <Pager>
            <Home ready={entered} />
            <About />
            <Work />
            <Contact />
          </Pager>
        </main>
      </ProjectProvider>
    </ReelProvider>
  )
}
