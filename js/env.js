/*
 * ==============================================================================
 * CodeCollab — Frontend Runtime Environment Configuration
 * ==============================================================================
 * This file allows configuring the backend API endpoint for decoupled hosting
 * (e.g. Frontend on Netlify/Vercel and Backend on Render/Railway/Fly.io).
 *
 * If left empty or undefined, the frontend automatically defaults to:
 * 1. <meta name="api-base-url" content="..."> in index.html, OR
 * 2. window.location.origin (current domain)
 */

window.__ENV__ = window.__ENV__ || {};

// Uncomment and set your deployed backend API URL if hosting frontend separately:
// window.__ENV__.API_BASE_URL = 'https://api.codecollab.dev';
