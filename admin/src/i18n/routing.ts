import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  defaultLocale: 'ru',
  localePrefix: 'never',
  locales: ['ru', 'uz'],
});

export type AppLocale = (typeof routing.locales)[number];
