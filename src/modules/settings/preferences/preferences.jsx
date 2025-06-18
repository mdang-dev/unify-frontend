import React from 'react';
import ModeSwitch from '@/src/components/base/mode-switch/mode-switch';
import SelectMenu from './_components/select-menu';
import PreferenceSection from './_components/preference-section';

const Preferences = () => {
  return (
    <div className="w-full max-w-3xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Preferences</h1>
        <p className="text-neutral-500">Customize your experience with these settings</p>
      </div>

      <div className="space-y-6">
        <PreferenceSection
          title="App Theme"
          description="Set how your app should look like with your preferred theme."
        >
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
            <div className="flex items-center space-x-3">
              <i className="fa-solid fa-palette text-xl text-primary"></i>
              <span className="font-medium">Dark Mode</span>
            </div>
            <ModeSwitch />
          </div>
        </PreferenceSection>

        <PreferenceSection
          title="Language"
          description="See all texts, messages, titles in your preferred language."
        >
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
            <div className="flex items-center space-x-3">
              <i className="fa-solid fa-language text-xl text-primary"></i>
              <span className="font-medium">Interface Language</span>
            </div>
            <SelectMenu />
          </div>
        </PreferenceSection>

        <PreferenceSection
          title="Notifications"
          description="Manage how you receive notifications and updates."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div className="flex items-center space-x-3">
                <i className="fa-solid fa-bell text-xl text-primary"></i>
                <span className="font-medium">Push Notifications</span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" />
                <div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-neutral-600 dark:bg-neutral-700"></div>
              </label>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div className="flex items-center space-x-3">
                <i className="fa-solid fa-envelope text-xl text-primary"></i>
                <span className="font-medium">Email Notifications</span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" />
                <div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-neutral-600 dark:bg-neutral-700"></div>
              </label>
            </div>
          </div>
        </PreferenceSection>

        <PreferenceSection
          title="Privacy"
          description="Control your privacy settings and data sharing preferences."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div className="flex items-center space-x-3">
                <i className="fa-solid fa-eye text-xl text-primary"></i>
                <span className="font-medium">Profile Visibility</span>
              </div>
              <select className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800">
                <option>Public</option>
                <option>Friends Only</option>
                <option>Private</option>
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div className="flex items-center space-x-3">
                <i className="fa-solid fa-chart-line text-xl text-primary"></i>
                <span className="font-medium">Activity Status</span>
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
