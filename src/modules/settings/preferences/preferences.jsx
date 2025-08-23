import React from 'react';
import { useTranslations } from 'next-intl';
import ModeSwitch from '@/src/components/base/mode-switch/mode-switch';
import SelectMenu from './_components/select-menu';
import PreferenceSection from './_components/preference-section';
// import NotificationSettings from '@/src/components/base/notification-settings';

const Preferences = () => {
  const t = useTranslations('Preferences');
  
  return (
    <div className="w-full max-w-3xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t('Title')}</h1>
        <p className="text-neutral-500">{t('Subtitle')}</p>
      </div>

      <div className="space-y-6">
        <PreferenceSection
          title={t('AppTheme.Title')}
          description={t('AppTheme.Description')}
        >
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
            <div className="flex items-center space-x-3">
              <i className="fa-solid fa-palette text-xl text-primary"></i>
              <span className="font-medium">{t('AppTheme.DarkMode')}</span>
            </div>
            <ModeSwitch />
          </div>
        </PreferenceSection>

        <PreferenceSection
          title={t('Language.Title')}
          description={t('Language.Description')}
        >
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
            <div className="flex items-center space-x-3">
              <i className="fa-solid fa-language text-xl text-primary"></i>
              <span className="font-medium">{t('Language.InterfaceLanguage')}</span>
            </div>
            <SelectMenu />
          </div>
        </PreferenceSection>

        <PreferenceSection
          title={t('Notifications.Title')}
          description={t('Notifications.Description')}
        >
        </PreferenceSection>

        <PreferenceSection
          title={t('Privacy.Title')}
          description={t('Privacy.Description')}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div className="flex items-center space-x-3">
                <i className="fa-solid fa-eye text-xl text-primary"></i>
                <span className="font-medium">{t('Privacy.ProfileVisibility')}</span>
              </div>
              <select className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800">
                <option>{t('Privacy.Public')}</option>
                <option>{t('Privacy.FriendsOnly')}</option>
                <option>{t('Privacy.Private')}</option>
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div className="flex items-center space-x-3">
                <i className="fa-solid fa-chart-line text-xl text-primary"></i>
                <span className="font-medium">{t('Privacy.ActivityStatus')}</span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" />
                <div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-neutral-600 dark:bg-neutral-700"></div>
              </label>
            </div>
          </div>
        </PreferenceSection>
      </div>
    </div>
  );
};

export default Preferences;
