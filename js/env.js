/*
 * ==============================================================================
 * CodeCollab — Frontend Runtime Environment Configuration
 * ==============================================================================
 * Configures the backend API endpoint for decoupled production hosting
 * (Frontend on Netlify & Backend on Railway).
 */

window.__ENV__ = window.__ENV__ || {};

// Previous production configuration - kept for deployment
// window.__ENV__.API_BASE_URL = window.__ENV__.API_BASE_URL || 'https://jubilant-octo-potato-production.up.railway.app';

// Local development configuration: auto-detects localhost vs production
const isLocalhost = typeof window !== 'undefined' && window.location && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     window.location.hostname === '0.0.0.0' || 
     window.location.hostname === '::1' || 
     window.location.hostname === '[::1]' || 
     window.location.hostname === '' || 
     window.location.protocol === 'file:');

window.__ENV__.API_BASE_URL = isLocalhost 
    ? 'http://localhost:3000' 
    : (window.__ENV__.API_BASE_URL || 'https://jubilant-octo-potato-production.up.railway.app');

if (isLocalhost) {
    window.API_BASE_URL = 'http://localhost:3000';
    try {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('CODECOLLAB_API_BASE_URL');
            if (stored && stored.includes('railway.app')) {
                localStorage.removeItem('CODECOLLAB_API_BASE_URL');
            }
        }
    } catch (_) {}
}
