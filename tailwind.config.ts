import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        darija: {
          green: "#10B981",
          "green-text": "#00422B",
          "green-container": "#10B981",
          red: "#EF4444",
          "red-text": "#410004",
          "red-container": "#DA3437",
        },
      },
      fontFamily: {
        arabic: ["'Noto Sans Arabic'", "sans-serif"],
        numbers: ["'Be Vietnam Pro'", "monospace"],
      },
      borderRadius: {
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};
export default config;