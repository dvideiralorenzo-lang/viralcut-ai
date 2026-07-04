/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#08080C",
        raised: "#101018",
        line: "rgba(245,243,255,0.08)",
        violet: "#7C5CFC",
        pink: "#FF4D8D",
        cyan: "#3DDBFF",
        ink: "#F5F3FF",
        dim: "#9A96B8",
        dimmer: "#605C7D",
      },
      fontFamily: {
        display: ["Archivo Expanded", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
