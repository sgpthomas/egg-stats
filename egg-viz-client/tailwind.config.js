/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 2s linear infinite",
      },
      colors: {
        transparent: "transparent",
        current: "currentColor",
        egg: {
          DEFAULT: "#FFEFD5",
          50: "#fff8ed",
          100: "#ffefd5",
          200: "#fedbaa",
          300: "#fdc174",
          400: "#fb9b3c",
          500: "#f97e16",
          600: "#ea630c",
          700: "#c24a0c",
          800: "#9a3a12",
          900: "#7c3212",
          950: "#431707",
        },
        eggshell: {
          DEFAULT: "#D5E5FF",
          active: "#5c9dfe",
          hover: "#3678fb",
          50: "#eff5ff",
          100: "#d5e5ff",
          200: "#bdd8ff",
          300: "#90c0ff",
          400: "#5c9dfe",
          500: "#3678fb",
          600: "#1f57f1",
          700: "#1842dd",
          800: "#1a37b3",
          900: "#1b348d",
          950: "#152156",
        },
      },
    },
  },
  plugins: [],
};
