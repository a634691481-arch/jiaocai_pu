const path = require('path')

const resolve = p => {
  return path.resolve(__dirname, p)
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // 注意此处，一定要 `path.resolve` 一下, 传入绝对路径
  // 你要有其他目录，比如 components，也必须在这里，添加一下
  content: [
    './index.html',
    './uni_modules/vk-uview-ui/components/**/*.{html,js,ts,jsx,tsx,vue}',
    './pages/**/*.{html,js,ts,jsx,tsx,vue}',
    './components/**/*.{html,js,ts,jsx,tsx,vue}',
  ].map(resolve),
  theme: {
    extend: {
      colors: {
        primary: 'var(--u-type-primary)',
        'primary-light': 'var(--u-type-primary-light)',
        'primary-dark': 'var(--u-type-primary-dark)',
        'primary-disabled': 'var(--u-type-primary-disabled)',
        secondary: 'var(--u-type-info)',
        success: 'var(--u-type-success)',
        warning: 'var(--u-type-warning)',
        error: 'var(--u-type-error)',
        info: 'var(--u-type-info)',
        'theme-text': 'var(--u-main-color)',
        'theme-text-grey': 'var(--u-tips-color)',
        'theme-bg': 'var(--u-bg-color)',
        'theme-bg-grey': 'var(--u-bg-gray-light)',
        'theme-border': 'var(--u-border-color)',
      },
    },
  },
  corePlugins: {
    // 跨多端可以 h5 开启，小程序关闭
    preflight: true,
  },
  plugins: [
    function ({ addUtilities, matchUtilities, theme }) {
      addUtilities({
        '.size-full': { width: '100%', height: '100%' },
      })
      matchUtilities(
        {
          size: value => ({ width: value, height: value }),
        },
        { values: theme('spacing') },
      )
    },
  ],
}
