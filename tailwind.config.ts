import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "mono"],
      },
      colors: {
        // Custom palette from the provided color palette image
        bg: {
          dark: "rgb(0, 5, 10)",
          DEFAULT: "rgb(230, 233, 238)",
          muted: "rgb(201, 209, 212)",
        },
        fg: {
          dark: "rgb(47, 47, 47)",
          DEFAULT: "rgb(255, 255, 255)",
          muted: "rgb(100, 100, 100)",
        },
        accent: {
          primary: "rgb(54, 236, 223)",
          secondary: "rgb(2, 31, 63)",
        },
        border: "rgb(201, 209, 212)",
      },
    },
  },
  plugins: [],
} satisfies Config;
