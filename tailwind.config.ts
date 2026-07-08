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
        "background": "#ffffff",
        "on-background": "#224870",
        "primary": "#224870",
        "secondary": "#00A8E8",
        "error": "#FF3E41",
        "tertiary": "#FFD131",
        "outline": "#224870",
        "surface": "#ffffff",
        "surface-container": "#f8f9fa",
        "void-black": "#224870",
        "sky-blue": "#00A8E8",
        "electric-navy": "#224870",
        "racing-red": "#FF3E41",
        "sunny-yellow": "#FFD131"
      },
      borderRadius: {
        "DEFAULT": "0px",
        "lg": "2px",
        "xl": "4px",
        "full": "9999px"
      },
      spacing: {
        "unit": "4px",
        "gutter": "16px",
        "stack-gap": "24px",
        "margin-desktop": "40px",
        "margin-mobile": "16px"
      },
      fontFamily: {
        "body-lg": ["Hanken Grotesk", "sans-serif"],
        "body-md": ["Hanken Grotesk", "sans-serif"],
        "headline-lg": ["Syne", "sans-serif"],
        "label-md": ["Space Mono", "monospace"],
        "label-sm": ["Space Mono", "monospace"],
        "headline-md": ["Syne", "sans-serif"],
        "display-lg-mobile": ["Syne", "sans-serif"],
        "display-lg": ["Syne", "sans-serif"],
        "label-bold": ["Space Mono", "monospace"],
        "handwriting": ["Gloria Hallelujah", "cursive"]
      },
      fontSize: {
        "body-lg": ["18px", { "lineHeight": "1.5", "fontWeight": "400" }],
        "body-md": ["16px", { "lineHeight": "1.5", "fontWeight": "400" }],
        "headline-lg": ["32px", { "lineHeight": "1.2", "fontWeight": "700" }],
        "label-md": ["14px", { "lineHeight": "1.2", "fontWeight": "700" }],
        "label-sm": ["12px", { "lineHeight": "1.2", "fontWeight": "500" }],
        "headline-md": ["24px", { "lineHeight": "1.2", "fontWeight": "700" }],
        "display-lg-mobile": ["40px", { "lineHeight": "1.1", "fontWeight": "800" }],
        "display-lg": ["64px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "800" }],
        "label-bold": ["14px", { "lineHeight": "1.2", "fontWeight": "700" }]
      }
    },
  },
  plugins: [],
};
export default config;
