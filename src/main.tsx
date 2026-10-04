import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/electrolize/400.css'
import '@fontsource/jetbrains-mono/400.css'
import App from './App'
import Checklist from './dev/Checklist'
import './index.css'

// Visit /?checklist to see which real files are still missing.
const q = new URLSearchParams(location.search)
const showChecklist = q.has('checklist')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{showChecklist ? <Checklist /> : <App />}</React.StrictMode>,
)
