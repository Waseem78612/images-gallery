/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Clash Display", "sans-serif"],
        body:    ["Satoshi", "sans-serif"],
      },
      colors: {
        accent:        "#6366F1",
        "accent-light":"#A5B4FC",
        "accent-glow": "rgba(99,102,241,0.15)",
        bg:            "#07070f",
        surface:       "#0e0e1a",
        card:          "#12121e",
        border:        "#1c1c2e",
      },
      animation: {
        fadeUp:  "fadeUp 0.45s cubic-bezier(0.4,0,0.2,1) both",
        blink:   "blink 1s step-end infinite",
        pulse2:  "pulse2 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s linear infinite",
      },
      keyframes: {
        fadeUp:  { from:{ opacity:"0", transform:"translateY(20px)" }, to:{ opacity:"1", transform:"translateY(0)" } },
        blink:   { "0%,100%":{ opacity:"1" }, "50%":{ opacity:"0" } },
        pulse2:  { "0%,100%":{ opacity:"0.6" }, "50%":{ opacity:"1" } },
        shimmer: { "0%":{ backgroundPosition:"-200% 0" }, "100%":{ backgroundPosition:"200% 0" } },
      },
    },
  },
  plugins: [],
};
