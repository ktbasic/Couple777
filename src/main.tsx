import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { AuthProvider } from './context/auth';
import { StoreProvider } from './context/store';
import { ToastProvider } from './components/ui/Toast';
import { App } from './App';
import './styles/global.css';

/**
 * Static hosts (a single-file preview, GitHub Pages) cannot rewrite deep links
 * to index.html, so those builds route on the hash instead. Build with
 * VITE_ROUTER=hash to get that; the dev server and any real deployment keep
 * clean paths.
 */
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      {/* Auth is outermost: the store loads the shared space for whoever is
          signed in, so it has to be told who that is first. */}
      <AuthProvider>
        <StoreProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </StoreProvider>
      </AuthProvider>
    </Router>
  </StrictMode>,
);
