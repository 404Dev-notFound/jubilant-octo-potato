/*
 * ==============================================================================
 * CodeCollab — Frontend Runtime Environment Configuration
 * ==============================================================================
 * Configures the backend API endpoint for decoupled production hosting
 * (Frontend on Netlify & Backend on Railway).
 */

window.__ENV__ = window.__ENV__ || {};

// Authoritative Production Railway Backend Endpoint
window.__ENV__.API_BASE_URL = window.__ENV__.API_BASE_URL || 'https://jubilant-octo-potato-production.up.railway.app';
