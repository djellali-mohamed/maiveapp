import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import './styles/brand.css'
import App from './App.tsx'
import { mockElectronAPI } from './lib/mockAPI'

// Inject mock API for browser preview
if (typeof window !== 'undefined' && !window.electronAPI) {
  (window as unknown as { electronAPI: typeof mockElectronAPI }).electronAPI = mockElectronAPI;
  console.log('Using mock Electron API for browser preview');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
