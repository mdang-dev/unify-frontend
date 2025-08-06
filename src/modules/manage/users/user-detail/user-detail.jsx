'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { userQueryApi } from '@/src/apis/user/query/user.query.api';
import { Button, Card, CardBody, CardHeader, Avatar, Chip, Tooltip } from '@heroui/react';
import { format } from 'date-fns';
import { useUserManagementStore } from '@/src/stores/user-management.store';

const UserDetail = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  const queryClient = useQueryClient();

  // Get store state to check if we have cached data
  const { hasCachedData } = useUserManagementStore();

  const { data: user, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [QUERY_KEYS.USERS, userId],
    queryFn: () => userQueryApi.getUserDetails(userId),
    enabled: !!userId,
    placeholderData: keepPreviousData, // Keep previous data while fetching new data
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnReconnect: false, // Don't refetch when reconnecting to network
  });

  const handleBack = () => {
    // Navigate back to user management with preserved state
    router.push('/manage/users/list');
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 0:
        return { label: 'Normal', color: 'success' };
      case 1:
        return { label: 'Temporarily Banned', color: 'warning' };
      case 2:
        return { label: 'Permanently Banned', color: 'danger' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <Button
              variant="light"
              onClick={handleBack}
              className="mb-4"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Back to User List
            </Button>
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
          <Card>
            <CardBody>
              <div className="animate-pulse space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <Button
              variant="light"
              onClick={handleBack}
              className="mb-4"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Back to User List
            </Button>
          </div>
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
              <h3 className="text-lg font-semibold text-red-600">Error Loading User</h3>
              <p className="text-sm text-muted-foreground">
                {error.message || 'An error occurred while loading user data'}
              </p>
              <Button
                variant="bordered"
                onClick={handleRefresh}
                className="mt-4"
              >
                <i className="fa-solid fa-rotate mr-2"></i>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <Button
              variant="light"
              onClick={handleBack}
              className="mb-4"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Back to User List
            </Button>
          </div>
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <i className="fa-solid fa-user-slash text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-muted-foreground">User Not Found</h3>
              <p className="text-sm text-muted-foreground">
                The requested user could not be found
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(user.status);

  return (
    <div className="h-screen w-full">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="light"
              onClick={handleBack}
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Back to User List
            </Button>
            {/* Refresh Button */}
            <Tooltip content="Refresh user data" placement="top">
              <Button
                isIconOnly
                variant="bordered"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="transition-all duration-200 hover:scale-105"
              >
                <i className={`fa-solid fa-rotate ${isFetching ? 'animate-spin' : ''}`}></i>
              </Button>
            </Tooltip>
          </div>
          <h1 className="text-4xl font-bold">User Details</h1>
          <p className="text-gray-500">
            Comprehensive information about {user.firstName} {user.lastName}
          </p>
          {/* Cache Status Indicator */}
          <div className="flex items-center gap-1 mt-2">
            <div className={`h-2 w-2 rounded-full ${isLoading ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
            <span className="text-xs text-muted-foreground">
              {isLoading ? 'Loading...' : 'Cached'}
            </span>
            {hasCachedData() && (
              <span className="text-xs text-blue-500 ml-2">
                • User list state preserved
              </span>
            )}
          </div>
        </div>

        {/* User Profile Card */}
        <Card className="mb-6">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={user.avatar?.url || '/images/default-avatar.png'}
                name={`${user.firstName} ${user.lastName}`}
                size="lg"
                className="flex-shrink-0"
              />
              <div>
                <h2 className="text-2xl font-semibold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-500">@{user.username}</p>
              </div>
            </div>
            <div className="flex gap-2 ml-auto">
              <Chip
                color={statusInfo.color}
                variant="flat"
                size="sm"
              >
                {statusInfo.label}
              </Chip>
              {user.reportApprovalCount > 0 && (
                <Chip
                  color="warning"
                  variant="flat"
                  size="sm"
                >
                  {user.reportApprovalCount} Reports
                </Chip>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* User Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="fa-solid fa-user text-primary"></i>
                Personal Information
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-sm">{user.firstName || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-sm">{user.lastName || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Username</label>
                  <p className="text-sm">@{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm">{user.phone || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-sm">
                    {user.gender === null ? 'Not specified' : 
                     user.gender ? 'Male' : 'Female'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Birthday</label>
                  <p className="text-sm">{formatDate(user.birthDay)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-sm">{user.location || 'Not specified'}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="fa-solid fa-briefcase text-primary"></i>
                Professional Information
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Education</label>
                <p className="text-sm">{user.education || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Work At</label>
                <p className="text-sm">{user.workAt || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Biography</label>
                <p className="text-sm">
                  {user.biography || 'No biography provided'}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-primary"></i>
                Account Information
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">User ID</label>
                <p className="text-sm font-mono">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center gap-2">
                  <Chip
                    color={statusInfo.color}
                    variant="flat"
                    size="sm"
                  >
                    {statusInfo.label}
                  </Chip>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Report Approval Count</label>
                <p className="text-sm">{user.reportApprovalCount || 0}</p>
              </div>
            </CardBody>
          </Card>

          {/* Avatar Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="fa-solid fa-image text-primary"></i>
                Avatar Information
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {user.avatar ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Avatar ID</label>
                    <p className="text-sm font-mono">{user.avatar.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Avatar URL</label>
                    <p className="text-sm break-all">{user.avatar.url}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-sm">{formatDate(user.avatar.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Avatar Preview</label>
                    <div className="mt-2">
                      <Avatar
                        src={user.avatar.url}
                        name={`${user.firstName} ${user.lastName}`}
                        size="lg"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No avatar uploaded</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDetail; 