import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};

// Remove the CSS import as it's not valid in middleware
// import './src/styles.css'; // Ensure CSS is loaded
