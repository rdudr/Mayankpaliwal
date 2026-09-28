import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/jetbrains-mono/400.css'
import App from './App'
import Checklist from './dev/Checklist'
import './index.css'

// Visit /?checklist to see which real files are still missing.
const showChecklist = new URLSearchParams(location.search).has('checklist')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{showChecklist ? <Checklist /> : <App />}</React.StrictMode>,
)
