import React from 'react'
import ReactDOM from 'react-dom/client'
import SimulatorCanvas from './components/canvas/SimulatorCanvas'
import './index.css'

// Restore persisted theme
const savedTheme = localStorage.getItem('syssim-theme')
if (savedTheme === 'light') {
  document.documentElement.classList.add('light')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SimulatorCanvas />
  </React.StrictMode>,
)
