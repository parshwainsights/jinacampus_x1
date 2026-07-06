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
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b"
        },
        campus: {
          navy: "#0f172a",
          cyan: "#06b6d4",
          muted: "#64748b",
          border: "#e2e8f0",
          success: "#16a34a",
          warning: "#d97706",
          danger: "#dc2626",
          info: "#0891b2"
        }
      },
      boxShadow: {
        glass: "0 24px 70px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.72)",
        elevated: "0 18px 48px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.72)",
        soft: "0 10px 28px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.72)",
        "inner-glass": "inset 0 1px 0 rgba(255, 255, 255, 0.72)"
      },
      backgroundImage: {
        "app-glass": "radial-gradient(circle at top left, rgba(79, 70, 229, 0.12), transparent 34%), radial-gradient(circle at top right, rgba(6, 182, 212, 0.12), transparent 30%), linear-gradient(135deg, #f8fafc 0%, #eef6ff 46%, #f8fafc 100%)",
        "glass-rim": "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.68))"
      }
    }
  },
  plugins: []
};

export default config;
