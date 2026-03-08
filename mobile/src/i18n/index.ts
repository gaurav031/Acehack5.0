import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import fr from './fr.json';
import es from './es.json';
import zh from './zh.json';
import ur from './ur.json';

const resources = {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    zh: { translation: zh },
    ur: { translation: ur },
};

const LANGUAGE_KEY = 'user-language';

const languageDetector: any = {
    type: 'languageDetector',
    async: true,
    detect: async (callback: (lang: string) => void) => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
            if (savedLanguage) {
                return callback(savedLanguage);
            }

            const bestLanguage = RNLocalize.findBestLanguageTag(Object.keys(resources));
            callback(bestLanguage?.languageTag || 'en');
        } catch (error) {
            console.log('Error detecting language:', error);
            callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, language);

            // Handle RTL for Urdu
            const isRTL = language === 'ur';
            if (I18nManager.isRTL !== isRTL) {
                I18nManager.allowRTL(isRTL);
                I18nManager.forceRTL(isRTL);
                // Note: App restart usually required for full RTL shift
            }
        } catch (error) {
            console.log('Error caching language:', error);
        }
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

export default i18n;
