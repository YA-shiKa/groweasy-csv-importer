import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12131A",
        paper: "#F7F7F5",
        slate: {
          950: "#0B0C10",
        },
        accent: {
          DEFAULT: "#5B5BF6",
          soft: "#E7E7FE",
        },
        signal: {
          good: "#1C8A5E",
          bad: "#C4483B",
          neutral: "#8A8D9A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
