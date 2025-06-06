const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui-components/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--sys-typescale-plain-font-family)', ...fontFamily.sans],
        brand: ['var(--sys-typescale-brand-font-family)', ...fontFamily.sans],
      },
      colors: {
        primary: 'rgb(var(--sys-color-primary) / <alpha-value>)',
        onPrimary: 'rgb(var(--sys-color-onPrimary) / <alpha-value>)',
        background: 'rgb(var(--sys-color-background) / <alpha-value>)',
        onBackground: 'rgb(var(--sys-color-onBackground) / <alpha-value>)',
        surface: 'rgb(var(--sys-color-surface) / <alpha-value>)',
        onSurface: 'rgb(var(--sys-color-onSurface) / <alpha-value>)',
        outline: 'rgb(var(--sys-color-outline) / <alpha-value>)',
      },
      borderRadius: {
        'none': 'var(--sys-shape-corner-none)',
        'xs': 'var(--sys-shape-corner-extra-small)',
        'sm': 'var(--sys-shape-corner-small)',
        'md': 'var(--sys-shape-corner-medium)',
        'lg': 'var(--sys-shape-corner-large)',
        'xl': 'var(--sys-shape-corner-extra-large)',
        'full': 'var(--sys-shape-corner-full)',
      },
      spacing: {
        'xxs': 'var(--sys-spacing-xxs)',
        'xs': 'var(--sys-spacing-xs)',
        'sm': 'var(--sys-spacing-sm)',
        'md': 'var(--sys-spacing-md)',
        'lg': 'var(--sys-spacing-lg)',
        'xl': 'var(--sys-spacing-xl)',
        'xxl': 'var(--sys-spacing-xxl)',
        'xxxl': 'var(--sys-spacing-xxxl)',
      },
      zIndex: {
        'canvas': 'var(--sys-zIndex-canvas)',
        'modal-backdrop': 'var(--sys-zIndex-modalBackdrop)',
        'modal': 'var(--sys-zIndex-modal)',
        'hud': 'var(--sys-zIndex-hud)',
        'orb': 'var(--sys-zIndex-orb)',
      }
    },
  },
  plugins: [],
} 