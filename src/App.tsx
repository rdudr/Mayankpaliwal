import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import About from './components/About'
import Contact, { Footer } from './components/Contact'
import Home from './components/Home'
import Loader from './components/Loader'
import Nav from './components/Nav'
import { ProjectProvider } from './components/ProjectModal'
import { ReelProvider } from './components/Reel'
import Work from './components/Work'
import { useReducedMotion } from './lib/hooks'
import { startSmoothScroll } from './lib/smooth'

// three.js + the scenes load in their own chunk while the loader plays.
const Scene = lazy(() => import('./scene/Scene'))

export default function App() {
  const reduced = useReducedMotion()
  const [sceneReady, setSceneReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const onReady = useCallback(() => setSceneReady(true), [])

  useEffect(() => startSmoothScroll(reduced), [reduced])

  return (
    <ReelProvider>
      <ProjectProvider>
        <a href="#work" className="skip-link">Skip to projects</a>
        <Suspense fallback={null}>
          <Scene reduced={reduced} onReady={onReady} />
        </Suspense>
        {!entered && <Loader ready={sceneReady} onDone={() => setEntered(true)} />}
        <Nav />
        <main className="relative z-[1]">
          <Home ready={entered} />
          <About />
          <Work />
          <Contact />
        </main>
        <Footer />
      </ProjectProvider>
    </ReelProvider>
  )
}
