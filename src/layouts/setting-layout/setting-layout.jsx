'use client';
import { useAuthStore } from '@/src/stores/auth.store';
import Title from './_components/title';
import NavButton from './_components/nav-button';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authCommandApi } from '@/src/apis/auth/command/auth.command.api';
import { deleteCookie } from '@/src/utils/cookies.util';
import { COOKIE_KEYS } from '@/src/constants/cookie-keys.constant';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsLayout = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const { setUser } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const t = useTranslations('Common');

  const logoutUser = async () => {
    try {
      await authCommandApi.logout();
    } catch (error) {
      console.warn('Logout API failed, proceeding with client-side logout:', error);
    }

    deleteCookie(COOKIE_KEYS.AUTH_TOKEN);
    queryClient.removeQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
    setUser(null);
    router.push('/login');
  };
  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full bg-white dark:bg-neutral-900">
      <div className="fixed left-20 top-0 flex h-[calc(100vh-64px)] w-[280px] flex-col border-r border-neutral-200 bg-white px-6 py-8 dark:border-neutral-800 dark:bg-neutral-900">
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
              <div>
                <Title content="Account" />
                <ul className="space-y-2">
                  <li className="h-12">
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="flex h-full w-full items-center gap-3 rounded-lg px-3 text-left text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <i className="fa-solid fa-sign-out-alt text-sm"></i>
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-96 rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <i className="fa-solid fa-sign-out-alt text-red-600 dark:text-red-400"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Confirm Logout
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to logout?
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    logoutUser();
                  }}
                  className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="ml-[360px] flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </div>
    </div>
  );
};

export default SettingsLayout;
