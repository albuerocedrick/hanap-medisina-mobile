/** @type {import('tailwindcss').Config} */
module.exports = {
  content:["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets:[require("nativewind/preset")], // Required for NativeWind v4
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Apple-like system colors
        background: "#F2F2F7", 
        card: "#FFFFFF",
        primary: "#34C759", 
        textDark: "#1C1C1E",
        textLight: "#8E8E93", 
        border: "#C6C6C8",
      },
      fontFamily: {
        // Mapped to the organic Quicksand font
        sans:["Quicksand_400Regular", "sans-serif"],
        medium: ["Quicksand_500Medium", "sans-serif"],
        semibold: ["Quicksand_600SemiBold", "sans-serif"],
        bold:["Quicksand_700Bold", "sans-serif"],
        // Quicksand's thickest weight is 700, so we map extrabold to it
        extrabold:["Quicksand_700Bold", "sans-serif"], 
      },
    },
  },
  plugins:[],
};