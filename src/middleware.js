import { NextResponse } from 'next/server';
import { COOKIE_KEYS } from './constants/cookie-keys.constant';
import { cookies } from 'next/headers';
import { getUser } from './utils/auth.util';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const protectedRoutes = new Set(['/statistics', '/manage']);
const publicRoutes = new Set([
  '/login',
  '/register',
  '/password/reset',
  '/landing',
  '/password/reset/otp-verification',
  '/password/reset/confirm',
]);

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req) {
  const i18nResponse = intlMiddleware(req);
  if (i18nResponse) return i18nResponse;

  const { pathname } = req.nextUrl;
  const isPublic = [...publicRoutes].some((route) => pathname.startsWith(route));
  const isProtected = [...protectedRoutes].some((route) => pathname.startsWith(route));
  const token = (await cookies()).get(COOKIE_KEYS.AUTH_TOKEN)?.value;

  if (!isPublic && !token) return NextResponse.redirect(new URL('/login', req.nextUrl));

  if (token && isPublic) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  if (token) {
    const { roles } = await getUser();
    const roleId = roles[0]?.id;

    if (isProtected && roleId === 2) {
      return NextResponse.rewrite(new URL('/page-not-found', req.nextUrl));
    }

    if (roleId === 1 && !isProtected) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/manage/users/list';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
