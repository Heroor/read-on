import config from './config.json'
import { i18nJSON, language } from '~/logic/storage'

export async function initTranslations(lang: string = 'en') {
  if (!config.languages.find(item => item.code === lang)) {
    lang = 'en'
  }
  const response = await fetch(browser.runtime.getURL(`i18n/${lang}.json`))
  i18nJSON.value = await response.json()
  language.value = lang
}

export function translate(key: string) {
  return i18nJSON.value[key] || ''
}
