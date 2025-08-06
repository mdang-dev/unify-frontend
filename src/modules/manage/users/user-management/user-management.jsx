'use client';
import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import Image from 'next/image';
import Avatar from '@/public/images/testAvt.jpg';
import filterLightIcon from '@/public/images/filter_lightmode.png';
import filterDarkIcon from '@/public/images/filter_darkmode.png';
import { useTheme } from 'next-themes';
import Error from 'next/error';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Select,
  SelectItem,
  Pagination,
  Tooltip,
} from '@heroui/react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import {
  Table as ShadcnTable,
  TableBody as ShadcnTableBody,
  TableCaption,
  TableCell as ShadcnTableCell,
  TableHead,
  TableHeader as ShadcnTableHeader,
  TableRow as ShadcnTableRow,
} from '@/src/components/ui/table';
import TableLoading from '../../_components/table-loading';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { userQueryApi } from '@/src/apis/user/query/user.query.api';
import { useRouter } from 'next/navigation';
import { useUserManagementStore } from '@/src/stores/user-management.store';

const UserManagement = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get state from store
  const {
    filters,
    currentPage,
    itemsPerPage,
    appliedFilters,
    cachedUsers,
    cachedTotalPages,
    cachedTotalElements,
    setFilters,
    setAppliedFilters,
    setPagination,
    setCachedData,
    clearCache,
    hasCachedData,
    getCachedState,
  } = useUserManagementStore();

  // Local state for immediate UI updates
  const [localFilters, setLocalFilters] = useState(filters);
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(itemsPerPage);

  // Initialize local state from store on mount
  useEffect(() => {
    setLocalFilters(filters);
    setLocalCurrentPage(currentPage);
    setLocalItemsPerPage(itemsPerPage);
  }, [filters, currentPage, itemsPerPage]);

  // API call with pagination and filters
  const { data: userResponse, isLoading: loading, error, refetch, isFetching } = useQuery({
    queryKey: [QUERY_KEYS.USERS, appliedFilters, currentPage, itemsPerPage],
    queryFn: () => userQueryApi.manageUsers({
      ...appliedFilters,
      page: currentPage - 1, // API expects 0-based indexing
      size: itemsPerPage,
    }),
    enabled: appliedFilters !== null, // Only fetch when filters are applied
    placeholderData: keepPreviousData, // Keep previous data while fetching new data
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnReconnect: false, // Don't refetch when reconnecting to network
  });

  // Cache the response data
  useEffect(() => {
    if (userResponse && appliedFilters !== null) {
      setCachedData(userResponse);
    }
  }, [userResponse, appliedFilters, setCachedData]);

  // Extract data from response or cache
  const users = userResponse?.users || cachedUsers || [];
  const totalPages = userResponse?.totalPages || cachedTotalPages || 0;
  const totalElements = userResponse?.totalElements || cachedTotalElements || 0;
  const hasNext = userResponse?.hasNext || false;
  const hasPrevious = userResponse?.hasPrevious || false;

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setAppliedFilters({ ...localFilters });
    setPagination(1, localItemsPerPage);
    setLocalCurrentPage(1);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      birthDay: '',
      email: '',
      status: '',
      username: '',
      firstName: '',
      lastName: '',
    };
    setLocalFilters(emptyFilters);
    setFilters(emptyFilters);
    setAppliedFilters(null);
    setPagination(1, localItemsPerPage);
    setLocalCurrentPage(1);
    clearCache();
  };

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePageChange = (page) => {
    setLocalCurrentPage(page);
    setPagination(page, localItemsPerPage);
  };

  const handleItemsPerPageChange = (value) => {
    const newItemsPerPage = parseInt(value);
    setLocalItemsPerPage(newItemsPerPage);
    setPagination(1, newItemsPerPage);
    setLocalCurrentPage(1);
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Invalidate cache for current query
  const handleInvalidateCache = () => {
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.USERS, appliedFilters, currentPage, itemsPerPage]
    });
  };

  // Check if at least one filter is applied
  const hasActiveFilters = useMemo(() => {
    return Object.values(localFilters).some(value => value !== '' && value !== null && value !== undefined);
  }, [localFilters]);

  const handleAction = (action, user) => {
    console.log(`${action} action for user:`, user);
    // Implement your action logic here
    if (action === 'view') {
      router.push(`/manage/users/detail/${user.id}`);
    } else {
      alert(`${action} action for user: ${user.username}`);
    }
  };

  return (
    <div className="h-screen w-full px-6 pb-10">
      <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="w-1/2">
            <h1 className="text-4xl font-bold">User List</h1>
            <p className="text-gray-500">
              Manage all users in the system with advanced filtering options.
            </p>
          </div>
          {/* Refresh Button */}
          {appliedFilters && (
            <div className="flex items-center gap-2">
              <Tooltip content="Refresh data" placement="top">
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
              {isFetching && (
                <span className="text-xs text-muted-foreground">Refreshing...</span>
              )}
            </div>
          )}
        </div>

        {/* Filter Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Filter Criteria</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Birthday Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Birthday</label>
              <Input
                type="date"
                placeholder="Select date"
                value={localFilters.birthDay}
                onChange={(e) => handleFilterChange('birthDay', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Email Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="text"
                placeholder="Enter email"
                value={localFilters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                placeholder="Select status"
                value={localFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full"
              >
                {/* status = 0; Normal */}
                <SelectItem key="0" value="0">Normal</SelectItem>
                {/* status = 1; Temporarily Banned */}
                <SelectItem key="1" value="1">Temporarily Banned</SelectItem>
                {/* status = 2; Permanently Banned */}
                <SelectItem key="2" value="2">Permanently Banned</SelectItem>
              </Select>
            </div>

            {/* Username Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                type="text"
                placeholder="Enter username"
                value={localFilters.username}
                onChange={(e) => handleFilterChange('username', e.target.value)}
                className="w-full"
              />
            </div>

            {/* First Name Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <Input
                type="text"
                placeholder="Enter first name"
                value={localFilters.firstName}
                onChange={(e) => handleFilterChange('firstName', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Last Name Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input
                type="text"
                placeholder="Enter last name"
                value={localFilters.lastName}
                onChange={(e) => handleFilterChange('lastName', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="mt-6 flex gap-3">
            <Button
              color="primary"
              onClick={handleApplyFilters}
              className="px-6"
              disabled={!hasActiveFilters}
            >
              Apply Filters
            </Button>
            <Button
              variant="bordered"
              onClick={handleClearFilters}
              className="px-6"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        {appliedFilters && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {users.length} of {totalElements} users
              </p>
              {/* Cache Status Indicator */}
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${loading ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                <span className="text-xs text-muted-foreground">
                  {loading ? 'Loading...' : hasCachedData() ? 'Cached' : 'Fresh'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <Select
                value={localItemsPerPage.toString()}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="w-20"
              >
                <SelectItem key="5" value="5">5</SelectItem>
                <SelectItem key="10" value="10">10</SelectItem>
                <SelectItem key="20" value="20">20</SelectItem>
                <SelectItem key="50" value="50">50</SelectItem>
              </Select>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="rounded-lg border bg-card">
          {loading ? (
            <TableLoading
              tableHeaders={['No.', 'Username', 'Email', 'First Name', 'Last Name', 'Status', 'Actions']}
            />
          ) : error ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <h3 className="text-lg font-semibold text-red-600">Error Loading Data</h3>
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
          ) : !appliedFilters ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <i className="fa-solid fa-filter text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold text-muted-foreground">No Data Displayed</h3>
                <p className="text-sm text-muted-foreground">
                  Apply filters to view user data
                </p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <i className="fa-solid fa-search text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold text-muted-foreground">No Users Found</h3>
                <p className="text-sm text-muted-foreground">
                  No users match the applied filters
                </p>
              </div>
            </div>
          ) : (
            <>
              <ShadcnTable>
                <ShadcnTableHeader>
                  <ShadcnTableRow>
                    <TableHead className="w-[80px]">No.</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </ShadcnTableRow>
                </ShadcnTableHeader>
                <ShadcnTableBody>
                  {users.map((user, index) => (
                    <ShadcnTableRow key={user.id + index}>
                      <ShadcnTableCell className="font-medium">
                        {(localCurrentPage - 1) * localItemsPerPage + index + 1}
                      </ShadcnTableCell>
                      <ShadcnTableCell>{user.username}</ShadcnTableCell>
                      <ShadcnTableCell>{user.email}</ShadcnTableCell>
                      <ShadcnTableCell>{user.firstName}</ShadcnTableCell>
                      <ShadcnTableCell>{user.lastName}</ShadcnTableCell>
                      <ShadcnTableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.status === 0 ? 'bg-green-100 text-green-800' :
                          user.status === 1 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 0 ? 'Normal' :
                           user.status === 1 ? 'Temporarily Banned' :
                           'Permanently Banned'}
                        </span>
                      </ShadcnTableCell>
                      <ShadcnTableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip content="View Profile" placement="top">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              color="primary"
                              onClick={() => handleAction('view', user)}
                            >
                              <i className="fa-solid fa-eye"></i>
                            </Button>
                          </Tooltip>
                          
                          <Tooltip content="Temporarily Disable" placement="top">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              color="warning"
                              onClick={() => handleAction('temporarily_disable', user)}
                            >
                              <i className="fa-solid fa-eye-slash"></i>
                            </Button>
                          </Tooltip>
                          
                          <Tooltip content="Permanently Disable" placement="top">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              color="danger"
                              onClick={() => handleAction('permanently_disable', user)}
                            >
                              <i className="fa-solid fa-user-slash"></i>
                            </Button>
                          </Tooltip>
                        </div>
                      </ShadcnTableCell>
                    </ShadcnTableRow>
                  ))}
                </ShadcnTableBody>
              </ShadcnTable>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Page {localCurrentPage} of {totalPages}
                  </div>
                  <Pagination
                    total={totalPages}
                    page={localCurrentPage}
                    onChange={handlePageChange}
                    showControls
                    color="primary"
                    isDisabled={loading}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
