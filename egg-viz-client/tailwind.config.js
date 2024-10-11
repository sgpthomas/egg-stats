/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        md: "0.3rem",
      },
      animation: {
        "spin-slow": "spin 2s linear infinite",
        "subtle-pulse":
          "subtlepulse 1.75s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        subtlepulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.65 },
        },
      },
      colors: {
        transparent: "transparent",
        current: "currentColor",
        egg: {
          DEFAULT: "#FFEFD5",
          // hover:
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
        mixed: {
          0: "#342821",
          20: "#483c36",
          40: "#4c4c4c",
          60: "#636363",
          80: "#7b7b7b",
          100: "#9f9894",
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
    fontFamily: {
      sans: ['"Plus Jakarta Sans"'],
      mono: ['"JetBrains Mono"'],
    },
  },
  darkMode: "selector",
  plugins: [],
};
