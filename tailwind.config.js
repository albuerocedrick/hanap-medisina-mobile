/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")], // <-- THIS IS THE MISSING PIECE
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Apple-like system colors
        background: "#F2F2F7", // iOS grouped background color
        card: "#FFFFFF",
        primary: "#34C759", // iOS System Green
        textDark: "#1C1C1E",
        textLight: "#8E8E93", // Subtle grey for secondary text
        border: "#C6C6C8",
      },
      fontFamily: {
        bold: ["SF-Pro-Bold", "sans-serif"],
        medium: ["SF-Pro-Medium", "sans-serif"],
        regular: ["SF-Pro-Regular", "sans-serif"],
      },
    },
  },
  plugins: [],
}