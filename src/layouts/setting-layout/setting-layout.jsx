'use client';
import { useAuthStore } from '@/src/stores/auth.store';
import Title from './_components/title';
import NavButton from './_components/nav-button';
import { useTranslations } from 'next-intl';

const SettingsLayout = ({ children }) => {
  const user = useAuthStore((s) => s.user);

  const t = useTranslations('Common');
  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full bg-white dark:bg-neutral-900">
      <div className="flex w-[320px] basis-1/4 flex-col border-r border-neutral-200 px-6 py-8 dark:border-neutral-800">
        <div className="space-y-8">
          <div>
            <h3 className="mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-2xl font-bold text-transparent">
              Settings
            </h3>
            <div className="space-y-6">
              <div>
                <Title content="Account settings" />
                <ul className="space-y-2">
                  <li className="h-12">
                    <NavButton
                      href="/settings/edit-profile"
                      iconClass="fa-solid fa-address-card"
                      content="Edit Profile"
                    />
                  </li>
                  <li className="h-12">
                    <NavButton
                      href={user ? `/settings/archive/${user.username}` : '/login'}
                      iconClass="fa-solid fa-box-archive"
                      content="View Archive"
                    />
                  </li>
                  <li className="h-12">
                    <NavButton
                      href="/settings/update-password"
                      iconClass="fa-solid fa-key"
                      content="Change password"
                    />
                  </li>
                </ul>
              </div>
              <div>
                <Title content="General settings" />
                <ul className="space-y-2">
                  <li className="h-12">
                    <NavButton
                      href="/settings/preferences"
                      iconClass="fa-brands fa-gratipay"
                      content="Preferences"
                    />
                  </li>
                  <li className="h-12">
                    <NavButton
                      href={user ? `/settings/support/${user.username}` : '/login'}
                      iconClass="fa-solid fa-info-circle"
                      content={t('Support')}
                    />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </div>
    </div>
  );
};

export default SettingsLayout;
