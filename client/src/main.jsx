import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './ThemeContext'   // ✅ add this

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>   {/* ✅ wrap App */}
      <App />
    </ThemeProvider>
  </StrictMode>,
)