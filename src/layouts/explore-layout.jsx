import { useTranslations } from 'next-intl';

export default function ExploreLayout({ children }) {
  const t = useTranslations('Explore');
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <nav className="p-4">
        <h1 className="text-2xl font-bold">{t('Title')}</h1>
      </nav>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
