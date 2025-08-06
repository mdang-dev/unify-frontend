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
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { userQueryApi } from '@/src/apis/user/query/user.query.api';

const UserManagement = () => {
  const [filters, setFilters] = useState({
    birthDay: '',
    email: '',
    status: '',
    username: '',
    firstName: '',
    lastName: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // API call with pagination and filters
  const { data: userResponse, isLoading: loading, error } = useQuery({
    queryKey: [QUERY_KEYS.USERS, appliedFilters, currentPage, itemsPerPage],
    queryFn: () => userQueryApi.manageUsers({
      ...appliedFilters,
      page: currentPage - 1, // API expects 0-based indexing
      size: itemsPerPage,
    }),
    enabled: appliedFilters !== null, // Only fetch when filters are applied
  });

  // Extract data from response
  const users = userResponse?.users || [];
  const totalPages = userResponse?.totalPages || 0;
  const totalElements = userResponse?.totalElements || 0;
  const hasNext = userResponse?.hasNext || false;
  const hasPrevious = userResponse?.hasPrevious || false;

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      birthDay: '',
      email: '',
      status: '',
      username: '',
      firstName: '',
      lastName: '',
    });
    setAppliedFilters(null);
    setCurrentPage(1);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Check if at least one filter is applied
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== '' && value !== null && value !== undefined);
  }, [filters]);

  return (
    <div className="h-screen w-full px-6 py-10">
      <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="w-1/2">
            <h1 className="text-4xl font-bold">User List</h1>
            <p className="text-gray-500">
              Manage all users in the system with advanced filtering options.
            </p>
          </div>
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
                value={filters.birthDay}
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
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                placeholder="Select status"
                value={filters.status}
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
                value={filters.username}
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
                value={filters.firstName}
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
                value={filters.lastName}
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
            <p className="text-sm text-muted-foreground">
              Showing {users.length} of {totalElements} users
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <Select
                value={itemsPerPage.toString()}
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
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </ShadcnTableRow>
                </ShadcnTableHeader>
                <ShadcnTableBody>
                  {users.map((user, index) => (
                    <ShadcnTableRow key={user.id + index}>
                      <ShadcnTableCell className="font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
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
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                            >
                              <i className="fa-solid fa-ellipsis-vertical"></i>
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu onAction={(key) => alert(key)}>
                            <DropdownItem key="view">
                              <i className="fa-solid fa-eye"></i> View Profile
                            </DropdownItem>
                            <DropdownItem key="temp" className="text-warning-500" color="warning">
                              <i className="fa-solid fa-eye-slash"></i> Temporarily Disable
                            </DropdownItem>
                            <DropdownItem key="perm" className="text-danger" color="danger">
                              <i className="fa-solid fa-user-slash"></i> Permanently Disable
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </ShadcnTableCell>
                    </ShadcnTableRow>
                  ))}
                </ShadcnTableBody>
              </ShadcnTable>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Pagination
                    total={totalPages}
                    page={currentPage}
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
