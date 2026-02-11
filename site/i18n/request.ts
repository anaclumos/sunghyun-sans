import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';
import type {AbstractIntlMessages} from 'next-intl';

function deepMerge(base: AbstractIntlMessages, override: AbstractIntlMessages): AbstractIntlMessages {
  const result = {...base};
  for (const key of Object.keys(override)) {
    if (
      typeof result[key] === 'object' && result[key] !== null &&
      typeof override[key] === 'object' && override[key] !== null
    ) {
      result[key] = deepMerge(
        result[key] as AbstractIntlMessages,
        override[key] as AbstractIntlMessages
      );
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const defaultMessages = (await import(`../messages/${routing.defaultLocale}.json`)).default;
  const localeMessages = locale === routing.defaultLocale
    ? defaultMessages
    : (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages: locale === routing.defaultLocale
      ? defaultMessages
      : deepMerge(defaultMessages, localeMessages)
  };
});
