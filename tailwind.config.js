const colors = require('tailwindcss/colors')

module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.ejs"],
  theme: {
    extend: {
      screens: {
        mobile:{'max': '480px'}
      }
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
