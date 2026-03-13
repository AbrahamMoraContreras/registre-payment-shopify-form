import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ThemeRegistry from './page.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeRegistry />
  </StrictMode>,
)
