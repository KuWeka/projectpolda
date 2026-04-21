
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import idTranslations from './locales/id.json';
import enTranslations from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      id: { translation: idTranslations },
      en: { translation: enTranslations }
    },
    lng: 'id',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

export default i18n;
