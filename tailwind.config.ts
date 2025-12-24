import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: '#EBF5FF',
          100: '#D6EBFF',
          200: '#A3D1FF',
          300: '#66B0FF',
          400: '#3393FF',
          500: '#0078FF',
          600: '#005AFF',
          700: '#0041E6',
          800: '#0A1491',
          900: '#050A5A',
        },
      },
    },
  },
  plugins: [],
};
export default config;


