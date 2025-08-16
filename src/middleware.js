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

// Routes that can be accessed by both authenticated and unauthenticated users
const sharedRoutes = new Set([
  '/shared', // Allow shared post links to be accessed without authentication
]);

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req) {
  // Handle i18n first (language middleware)
  const i18nResponse = intlMiddleware(req);

  // Auth logic begins here
  const { pathname } = req.nextUrl;
  const token = (await cookies()).get(COOKIE_KEYS.AUTH_TOKEN)?.value;

  const isPublic = [...publicRoutes].some((route) => pathname.startsWith(route));
  const isShared = [...sharedRoutes].some((route) => pathname.startsWith(route));
  const isProtected = [...protectedRoutes].some((route) => pathname.startsWith(route));

  // If not authenticated and accessing a protected route, redirect to login
  if (!isPublic && !isShared && !token) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // If authenticated and accessing a public route, redirect to home
  if (token && isPublic) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated, check user role for access control
  if (token) {
    const { roles } = await getUser();
    const roleId = roles[0]?.id;

    // If the user is a regular user (roleId === 2) and tries to access protected route, show not found
    if (isProtected && roleId === 2) {
      return NextResponse.rewrite(new URL('/page-not-found', req.nextUrl));
    }

    // If the user is an admin (roleId === 1) and accesses non-admin route, redirect to admin dashboard
    if (roleId === 1 && !isProtected && !isShared) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/manage/users/list';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return i18nResponse;
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|robots.txt|.*\\..*).*)'],
};
