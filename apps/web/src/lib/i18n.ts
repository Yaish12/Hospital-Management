import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { dashboard: 'Dashboard', queue: 'Queue', prescriptions: 'Prescriptions' } },
    hi: { translation: { dashboard: 'डैशबोर्ड', queue: 'कतार', prescriptions: 'नुस्खे' } }
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export default i18n
