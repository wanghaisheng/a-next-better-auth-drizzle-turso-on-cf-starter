export const defaultLocale = 'en';

export const locales = ['en', 'zh', 'ja'] as const;

export type Locale = (typeof locales)[number];

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Language tag mapping to language name
export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

// Optional: Define language direction (for RTL languages like Arabic)
export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  zh: 'ltr',
  ja: 'ltr',
  // If adding Arabic: ar: 'rtl'
};
