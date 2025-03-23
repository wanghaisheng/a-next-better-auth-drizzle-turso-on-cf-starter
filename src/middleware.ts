import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - if they start with `/api`, `/_next`, `/static`, `/checkout`
  // - the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|static|checkout|.*\\..*).*)', '/(en|zh|ja)/:path*']
};
