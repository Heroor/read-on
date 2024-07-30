import { defineConfig } from 'unocss/vite'
import { presetAttributify, presetIcons, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
  ],
  transformers: [
    transformerDirectives(),
  ],
  rules: [
    ['text-overflow-ellipsis', {
      'overflow': 'hidden',
      'text-overflow': 'ellipsis',
      'white-space': 'nowrap',
      'word-break': 'break-all',
    }],
    ['text-overflow-2-line', {
      'display': '-webkit-box',
      'overflow': 'hidden',
      'text-overflow': 'ellipsis',
      '-webkit-line-clamp': '2',
      '-webkit-box-orient': 'vertical',
      'word-break': 'break-all',
    }],
  ],
})
