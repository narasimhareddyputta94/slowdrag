import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Map the class 'font-offbit' to the variable defined in layout
        offbit: ["var(--font-offbit)", "monospace"], 
      },
      colors: {
        // Custom teal match from screenshot
        "slow-teal": "#14907D", 
      },
    },
  },
  plugins: [],
};
export default config;