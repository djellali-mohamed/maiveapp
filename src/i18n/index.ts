import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // Default language
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;

// Helper function to change language
export const changeLanguage = (lang: 'fr' | 'en') => {
  i18n.changeLanguage(lang);
};

// Helper to get current language
export const getCurrentLanguage = (): 'fr' | 'en' => {
  return (i18n.language as 'fr' | 'en') || 'fr';
};
