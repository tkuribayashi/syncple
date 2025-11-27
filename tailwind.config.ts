import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFB6D9',
          dark: '#FF8DC7',
          light: '#FFE1ED',
        },
        secondary: {
          DEFAULT: '#E0D4F7',
          dark: '#C7B8EA',
          light: '#F3EBFF',
        },
        accent: {
          DEFAULT: '#D4F1F4',
          dark: '#B5E8EB',
          light: '#E8F8F5',
        },
      },
    },
  },
  plugins: [],
}
export default config
