import LocaleLayout from '@/src/layouts/local-layout';

export default function Layout({ children, params }) {
  return <LocaleLayout params={params}>{children}</LocaleLayout>;
}
