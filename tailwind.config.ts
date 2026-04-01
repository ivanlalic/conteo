import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-light": "var(--color-primary-light)",
        "primary-medium": "var(--color-primary-medium)",
        "bg-page": "var(--color-bg-page)",
        "bg-card": "var(--color-bg-card)",
        "bg-hover": "var(--color-bg-hover)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        border: "var(--color-border)",
        "border-light": "var(--color-border-light)",
        positive: "var(--color-positive)",
        warning: "var(--color-warning)",
        negative: "var(--color-negative)",
      },
    },
  },
  plugins: [],
};
export default config;
