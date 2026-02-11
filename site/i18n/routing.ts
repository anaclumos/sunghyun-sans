import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'kr', 'jp'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});
