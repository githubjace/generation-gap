import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#12081f',
        panel: '#171329',
        raised: '#1f1a35',
        line: '#2c2646',
        muted: '#a9a3c4',
      },
    },
  },
  plugins: [],
};
export default config;
