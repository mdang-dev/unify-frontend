import Cookies from 'js-cookie';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

export function setCookie(name, value, options = {}) {
  Cookies.set(name, value, options);
}

export function setTokenCookie(token) {
  if (!token) return;
  const { exp } = JSON.parse(atob(token.split('.')[1]));
  const expires = new Date(exp * 1000);
  setCookie(COOKIE_KEYS.AUTH_TOKEN, token, {
    path: '/',
    expires,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
}

export function getCookie(name) {
  return Cookies.get(name) || null;
}

export function deleteCookie(name) {
  Cookies.remove(name, { path: '/' });
}
