'use client';
import React from 'react';

const UserInfo = ({ user }) => {
  return (
    <div className="space-y-4 dark:text-zinc-300">
      <div className="flex items-center space-x-4">
        <div className="relative h-[140px] w-[140px] overflow-hidden rounded-full border-2 border-gray-300">
          {user?.avatar?.url ? (
            <img src={user.avatar.url} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <img
              src="/images/unify_icon_2.svg"
              alt="Default Avatar"
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.username || 'Unknown'}</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {user.firstName} {user.lastName}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm">
          <span className="font-semibold">Biography:</span> {user.biography || 'No bio provided'}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Email:</span> {user.email || ''}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Phone:</span> {user.phone || ''}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Birthday:</span>{' '}
          {user.birthDay ? new Date(user.birthDay).toLocaleDateString() : ''}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Gender:</span>{' '}
          {user.gender === false ? 'Female' : user.gender === true ? 'Male' : 'Not specified'}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Registered At:</span>{' '}
          {user.registeredAt ? new Date(user.registeredAt).toLocaleString() : ''}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Work At:</span> {user.workAt || ''}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Education:</span> {user.education || ''}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Location:</span> {user.location || ''}
        </p>
      </div>
    </div>
  );
};

export default UserInfo;
