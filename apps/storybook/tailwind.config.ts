import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './stories/**/*.mdx',
    './stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../../packages/ui-components/src/**/*.{js,ts,jsx,tsx,mdx}' 
  ],
  // Inherit or define theme. For now, let ui-components be self-styled or use global styles.
  // If your ui-components rely on specific theme extensions from the web-app,
  // you might need to duplicate or share that theme configuration.
  // For simplicity, using a minimal theme here:
  theme: {
    extend: {
      // Copied from apps/web-app/tailwind.config.ts for consistency
      colors: {
        primary: '#0A0A0A',
        secondary: '#4A90E2',
        accent: '#F5A623',
        textLight: '#EAEAEA',
        textDark: '#333333',
        backgroundLight: '#FFFFFF',
        backgroundDark: '#121212',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config; 