import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          300: "#C084FC",
          400: "#A855F7",
          500: "#9333EA",
        },
        flow: {
          cyan: "#06B6D4",
          green: "#22C55E",
          yellow: "#EAB308",
          red: "#EF4444",
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', "Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        panel: "0 20px 60px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
