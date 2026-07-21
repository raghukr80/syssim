import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import SimulatorCanvas from './components/canvas/SimulatorCanvas'
import { ToolRouter } from './pages/tools/ToolRouter'
import './index.css'

// Restore persisted theme
const savedTheme = localStorage.getItem('syssim-theme')
if (savedTheme === 'light') {
  document.documentElement.classList.add('light')
}

function App() {
  // Simple hash-based routing
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigateToCanvas = useCallback(() => {
    window.location.hash = '';
  }, []);

  // #tools or #tools/:toolId → show tools page
  if (hash.startsWith('#tools')) {
    return <ToolRouter onBack={navigateToCanvas} />;
  }

  return <SimulatorCanvas />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)