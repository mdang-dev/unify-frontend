import { COOKIE_KEYS } from '../constants/cookie-keys.constant';
import { getCookie, setCookie } from './cookies.util';

export function getLocale() {
  return getCookie(COOKIE_KEYS.LOCALE) || 'en';
}

export function changeLocale(locale) {
  setCookie(COOKIE_KEYS.LOCALE, locale, { path: '/' });
  window.location.reload();
}
