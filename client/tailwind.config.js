/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F1216", // Dark Obsidian (Main BG)
        surface: "#1E2126",    // Lighter Gray (Cards/Diagram BG) - ISSE UPDATE KARO
        primary: "#00d4ff",    // Cyan
        secondary: "#00ff9d",  // Neon Green
        "text-main": "#ffffff",
        "text-muted": "#94a3b8",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

