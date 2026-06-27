import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import axios from 'axios'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Automatically rewrite hardcoded localhost backend URLs to the deployed production backend URL if configured
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith("http://localhost:8000")) {
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
    config.url = config.url.replace("http://localhost:8000", apiBase);
  }
  return config;
});

// Enable sending cookies cross-origin by default
axios.defaults.withCredentials = true;



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
