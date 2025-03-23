import { Locale } from '@/i18n-config';
import { routing } from '@/src/i18n/routing';

/**
 * Loads translation messages for a specific locale
 * If messages for the requested locale can't be loaded, falls back to the default locale
 */
export async function getMessages(locale: string) {
  try {
    // Try to load messages for the requested locale
    return (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Could not load messages for locale: ${locale}`, error);

    // Fall back to default locale
    try {
      return (await import(`../messages/${routing.defaultLocale}.json`)).default;
    } catch (fallbackError) {
      console.error(`Failed to load fallback messages for locale: ${routing.defaultLocale}`, fallbackError);
      // Return empty object as last resort to prevent app crash
      return {};
    }
  }
}
