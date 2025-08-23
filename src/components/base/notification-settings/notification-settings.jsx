'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from '@/src/components/ui/switch';
import { Label } from '@/src/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Separator } from '@/src/components/ui/separator';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    followNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    tagNotifications: true,
    emailNotifications: false,
    pushNotifications: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse notification settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const notificationTypes = [
    {
      key: 'followNotifications',
      title: 'Follow Notifications',
      description: 'Get notified when someone follows you',
      icon: 'fa-solid fa-user-plus',
    },
    {
      key: 'likeNotifications',
      title: 'Like Notifications',
      description: 'Get notified when someone likes your post',
      icon: 'fa-solid fa-heart',
    },
    {
      key: 'commentNotifications',
      title: 'Comment Notifications',
      description: 'Get notified when someone comments on your post',
      icon: 'fa-regular fa-comment',
    },
    {
      key: 'tagNotifications',
      title: 'Tag Notifications',
      description: 'Get notified when someone tags you in a post',
      icon: 'fa-solid fa-at',
    },
  ];

  const deliveryMethods = [
    {
      key: 'pushNotifications',
      title: 'Push Notifications',
      description: 'Receive notifications in the app',
      icon: 'fa-solid fa-bell',
    },
    {
      key: 'emailNotifications',
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: 'fa-solid fa-envelope',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notification Settings</h2>
        <p className="text-muted-foreground">
          Manage how you receive notifications and what types of notifications you want to see.
        </p>
      </div>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type, index) => (
            <div key={type.key}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <i className={`${type.icon} text-lg text-gray-600 dark:text-gray-400`}></i>
                  <div>
                    <Label htmlFor={type.key} className="text-sm font-medium">
                      {type.title}
                    </Label>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                <Switch
                  id={type.key}
                  checked={settings[type.key]}
                  onCheckedChange={(checked) => updateSetting(type.key, checked)}
                />
              </div>
              {index < notificationTypes.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Methods</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deliveryMethods.map((method, index) => (
            <div key={method.key}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <i className={`${method.icon} text-lg text-gray-600 dark:text-gray-400`}></i>
                  <div>
                    <Label htmlFor={method.key} className="text-sm font-medium">
                      {method.title}
                    </Label>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                </div>
                <Switch
                  id={method.key}
                  checked={settings[method.key]}
                  onCheckedChange={(checked) => updateSetting(method.key, checked)}
                />
              </div>
              {index < deliveryMethods.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage all notifications at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => {
              const allEnabled = { ...settings };
              Object.keys(allEnabled).forEach(key => {
                allEnabled[key] = true;
              });
              setSettings(allEnabled);
              localStorage.setItem('notificationSettings', JSON.stringify(allEnabled));
            }}
            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 rounded-md transition-colors"
          >
            <i className="fa-solid fa-check-double mr-2"></i>
            Enable All Notifications
          </button>
          
          <button
            onClick={() => {
              const allDisabled = { ...settings };
              Object.keys(allDisabled).forEach(key => {
                allDisabled[key] = false;
              });
              setSettings(allDisabled);
              localStorage.setItem('notificationSettings', JSON.stringify(allDisabled));
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 rounded-md transition-colors"
          >
            <i className="fa-solid fa-ban mr-2"></i>
            Disable All Notifications
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings; 