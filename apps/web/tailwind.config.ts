import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:     "#f4f1e8",
        ink:    "#0b0b0b",
        "ink-2":"#2a2a2a",
        mute:   "#6b6b6b",
        red:    "#2f4fbd",
        hi:     "#ffe600",
        paper:  "#ebe7d8",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: { none: "0" },
    },
  },
  corePlugins: {
    preflight: true,
  },
};
export default config;
