/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // allows explicit dark mode + system sync
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2563EB",
          light: "#60A5FA",
          dark: "#1E3A8A",
        },
      },
    },
  },
  plugins: [],
};