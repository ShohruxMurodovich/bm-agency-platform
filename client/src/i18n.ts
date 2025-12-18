import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import ru from './locales/ru.json';
import uz from './locales/uz.json';

const messages = {
    en,
    ru,
    uz
};

const savedLocale = localStorage.getItem('lang') || 'ru';

const i18n = createI18n({
    legacy: false, // Usage of Composition API
    locale: savedLocale,
    fallbackLocale: 'ru',
    messages,
    globalInjection: true
});

export default i18n;
