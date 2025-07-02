import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

export default async function LocaleLayout({ children }) {
  const locale = await getLocale();
  return <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>;
}
