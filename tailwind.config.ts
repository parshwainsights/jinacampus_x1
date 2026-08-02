import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/modules/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef3ff",
          100: "#dce7ff",
          200: "#bed0ff",
          300: "#94afff",
          400: "#6686fb",
          500: "#2457e6",
          600: "#1d49cf",
          700: "#193cab",
          800: "#1b3688",
          900: "#312e81",
          950: "#171540"
        },
        campus: {
          navy: "#0b1638",
          cyan: "#155eef",
          teal: "#12b8a6",
          gold: "#c8a44d",
          muted: "#68738f",
          border: "#d9e1f2",
          success: "#16875b",
          warning: "#b7791f",
          danger: "#c63c4d",
          info: "#1769aa"
        },
        "app-background": "#f6f8ff",
        surface: "#ffffff",
        "surface-muted": "#eef2fb",
        sidebar: "#030f2e",
        ink: "#0b1638"
      },
      fontFamily: {
        sans: ["var(--font-ui)", "Manrope", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Nunito Sans", "system-ui", "sans-serif"]
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.5rem",
        "2xl": "0.5rem",
        "3xl": "0.5rem"
      },
      boxShadow: {
        glass: "0 18px 44px rgba(11, 22, 56, 0.10)",
        elevated: "0 14px 32px rgba(11, 22, 56, 0.09)",
        soft: "0 6px 18px rgba(11, 22, 56, 0.07)",
        "inner-glass": "inset 0 1px 0 rgba(255, 255, 255, 0.72)"
      },
      backgroundImage: {
        "app-glass": "linear-gradient(180deg, #f6f8ff 0%, #eef2fb 100%)",
        "glass-rim": "linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)"
      }
    }
  },
  plugins: []
};

export default config;
