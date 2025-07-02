import { defineRouting } from 'next-intl/routing';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

export const routing = defineRouting({
  locales: ['en', 'vi'],
  defaultLocale: 'en',
  localeDetection: true,
  localePrefix: 'never',
  localeCookie: COOKIE_KEYS.LOCALE,
});
