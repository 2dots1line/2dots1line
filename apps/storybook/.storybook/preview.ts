import type { Preview } from '@storybook/react';
import '../styles/globals.css'; // Path to your global CSS / Tailwind base

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview; 