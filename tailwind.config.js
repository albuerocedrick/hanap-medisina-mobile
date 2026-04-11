/** @type {import('tailwindcss').Config} */
module.exports = {
  // ✅ Now it scans your Expo Router screens and your custom src components
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
