import { COOKIE_KEYS } from '../constants/cookie-keys.constant';
import { getCookie, setCookie } from './cookies.util';

export function getLocale() {
  return getCookie(COOKIE_KEYS.LOCALE) || 'en';
}

export function changeLocale(locale) {
  setCookie(COOKIE_KEYS.LOCALE, locale, { path: '/' });
  // Use next-intl router for better UX without page reload
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const currentHash = window.location.hash;

    // Navigate to the same page with new locale
    window.location.href = `${currentPath}${currentSearch}${currentHash}`;
  }
}
