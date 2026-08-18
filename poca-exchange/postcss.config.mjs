/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {
      // Ensure Tailwind v4 postcss is loaded
    },
  },
};

export default config;
