/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        "on-secondary": "#470083",
        "on-tertiary-container": "#ffffff",
        "inverse-on-surface": "#2e3037",
        "secondary-fixed-dim": "#dbb8ff",
        "secondary-fixed": "#efdbff",
        "surface-container-highest": "#32353c",
        "on-background": "#e1e2eb",
        "on-primary": "#002e6b",
        "on-primary-container": "#ffffff",
        "on-secondary-fixed": "#2b0052",
        "on-tertiary": "#00382d",
        "secondary-container": "#6807ba",
        "tertiary-fixed": "#6bfad8",
        "secondary": "#dbb8ff",
        "tertiary-container": "#00866f",
        "primary-fixed": "#d8e2ff",
        "surface-container": "#1d2026",
        "error": "#ffb4ab",
        "surface-container-low": "#191c22",
        "surface-variant": "#32353c",
        "surface-container-lowest": "#0b0e14",
        "outline": "#8b90a0",
        "surface-tint": "#aec6ff",
        "on-error-container": "#ffdad6",
        "on-surface-variant": "#c1c6d7",
        "tertiary": "#48ddbc",
        "on-secondary-fixed-variant": "#6600b7",
        "background": "#10131a",
        "primary-fixed-dim": "#aec6ff",
        "error-container": "#93000a",
        "primary-container": "#0070f3",
        "primary": "#aec6ff",
        "surface-dim": "#10131a",
        "on-primary-fixed-variant": "#004397",
        "on-surface": "#e1e2eb",
        "on-tertiary-fixed": "#002019",
        "surface-container-high": "#272a31",
        "on-primary-fixed": "#001a43",
        "on-tertiary-fixed-variant": "#005142",
        "surface": "#10131a",
        "tertiary-fixed-dim": "#48ddbc",
        "on-secondary-container": "#d0a6ff",
        "inverse-surface": "#e1e2eb",
        "on-error": "#690005",
        "outline-variant": "#414754",
        "inverse-primary": "#0059c5",
        "surface-bright": "#363940"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "sm": "1rem",
        "container-max": "1200px",
        "md": "1.5rem",
        "lg": "2rem",
        "gutter": "24px",
        "base": "4px",
        "xs": "0.5rem",
        "xl": "3rem"
      },
      fontFamily: {
        "headline-lg": ["Geist", "sans-serif"],
        "display": ["Geist", "sans-serif"],
        "body-lg": ["Geist", "sans-serif"],
        "label-sm": ["JetBrains Mono", "monospace"],
        "body-md": ["Geist", "sans-serif"],
        "label-md": ["JetBrains Mono", "monospace"],
        "headline-md": ["Geist", "sans-serif"],
        "body-sm": ["Geist", "sans-serif"],
        "orpheus": ["'Orpheus'", "'Orpheus Pro'", "serif"],
        "bandito": ["'Bandito'", "cursive", "sans-serif"]
      }
    }
  },
  plugins: []
};
