'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Select,
  SelectItem,
  Pagination,
  Tooltip,
} from '@heroui/react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { adminReportsQueryApi } from '@/src/apis/reports/query/admin-reports.query.api';
import { useReportedUsersStore } from '@/src/stores/reported-users.store';
import ReportedUsersFilters from './_components/reported-users-filters';
import ReportedUsersTable from './_components/reported-users-table';
import TableLoading from '../../_components/table-loading';
import { toast } from 'sonner';

const ReportedUsers = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get state from store
  const {
    filters,
    currentPage,
    itemsPerPage,
    sortField,
    sortDirection,
    appliedFilters,
    cachedReportedUsers,
    cachedTotalPages,
    cachedTotalElements,
    setFilters,
    setAppliedFilters,
    setPagination,
    setSorting,
    setCachedData,
    clearCache,
    hasCachedData,
  } = useReportedUsersStore();

  // Local state for immediate UI updates
  const [localFilters, setLocalFilters] = useState(filters);
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(itemsPerPage);
  const [localSortField, setLocalSortField] = useState(sortField);
  const [localSortDirection, setLocalSortDirection] = useState(sortDirection);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize local state from store on mount
  useEffect(() => {
    setLocalFilters(filters);
    setLocalCurrentPage(currentPage);
    setLocalItemsPerPage(itemsPerPage);
    setLocalSortField(sortField);
    setLocalSortDirection(sortDirection);
  }, [filters, currentPage, itemsPerPage, sortField, sortDirection]);



  // API call with pagination, filters, and sorting
  const { data: reportResponse, isLoading: loading, error, refetch, isFetching } = useQuery({
    queryKey: [QUERY_KEYS.REPORTED_USERS, appliedFilters, currentPage, itemsPerPage, sortField, sortDirection],
    queryFn: () => adminReportsQueryApi.getReportedUsers({
      ...appliedFilters,
      page: currentPage - 1, // Convert 1-based to 0-based
      size: itemsPerPage,
      sort: `${sortField},${sortDirection}`,
    }),
    enabled: appliedFilters !== null, // Only fetch when filters are applied
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Cache the response data
  useEffect(() => {
    if (reportResponse && appliedFilters !== null) {
      setCachedData(reportResponse);
    }
  }, [reportResponse, appliedFilters, setCachedData]);

  // Extract data from response or cache
  const reportedUsers = reportResponse?.content || cachedReportedUsers || [];
  const totalPages = reportResponse?.totalPages || cachedTotalPages || 0;
  const totalElements = reportResponse?.totalElements || cachedTotalElements || 0;

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setAppliedFilters({ ...localFilters });
    setPagination(1, localItemsPerPage);
    setSorting(localSortField, localSortDirection);
    setLocalCurrentPage(1);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      status: '',
      reportedAtFrom: null,
      reportedAtTo: null,
    };
    setLocalFilters(emptyFilters);
    setFilters(emptyFilters);
    setAppliedFilters(null);
    setPagination(1, localItemsPerPage);
    setSorting('latestReportedAt', 'desc');
    setLocalCurrentPage(1);
    setLocalSortField('latestReportedAt');
    setLocalSortDirection('desc');
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

  const handleSort = (field, direction) => {
    setLocalSortField(field);
    setLocalSortDirection(direction);
    setSorting(field, direction);
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
      queryKey: [QUERY_KEYS.REPORTED_USERS, appliedFilters, currentPage, itemsPerPage, sortField, sortDirection]
    });
  };

  // Check if at least one filter is applied
  const hasActiveFilters = useMemo(() => {
    return Object.values(localFilters).some(value => value !== '' && value !== null && value !== undefined);
  }, [localFilters]);

  const handleAction = (action, report) => {
    console.log(`${action} action for report:`, report);
    // Implement your action logic here
    if (action === 'view') {
      router.push(`/manage/users/detail/${report.reportedId}`);
    } else if (action === 'reports') {
      router.push(`/manage/users/reports/${report.reportedId}`);
    }
  };

  return (
    <div className="h-screen w-full px-6 pb-10">
      <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="w-1/2">
            <h1 className="text-4xl font-bold">Reported Users</h1>
            <p className="text-gray-500">
              Manage reported users with advanced filtering and sorting options.
            </p>
          </div>
          {/* Filter Toggle and Refresh Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="bordered"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <i className="fa-solid fa-filter"></i>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <Select
                selectedKeys={[String(localItemsPerPage)]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] ?? String(localItemsPerPage);
                  handleItemsPerPageChange(value);
                }}
                className="w-20"
              >
                <SelectItem key="10">10</SelectItem>
                <SelectItem key="20">20</SelectItem>
                <SelectItem key="50">50</SelectItem>
                <SelectItem key="100">100</SelectItem>
              </Select>
            </div>
            {appliedFilters && (
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
            )}
          </div>
        </div>

        {/* Filter Section */}
        {showFilters && (
          <ReportedUsersFilters
            localFilters={localFilters}
            onFilterChange={handleFilterChange}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {/* Results Summary */}
        {appliedFilters && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {reportedUsers.length} of {totalElements} reported users
              </p>
              {/* Cache Status Indicator */}
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${loading ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                <span className="text-xs text-muted-foreground">
                  {loading ? 'Loading...' : hasCachedData() ? 'Cached' : 'Fresh'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="rounded-lg border bg-card">
          {loading ? (
            <TableLoading
              tableHeaders={['No.', 'User', 'Reports', 'Latest Reported At', 'Status', 'Actions']}
            />
          ) : error ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <h3 className="text-lg font-semibold text-red-600">Error Loading Data</h3>
                <p className="text-sm text-muted-foreground">
                  {error.message || 'An error occurred while loading reported users data'}
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
                  Apply filters to view reported users data
                </p>
              </div>
            </div>
          ) : reportedUsers.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <i className="fa-solid fa-search text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold text-muted-foreground">No Reported Users Found</h3>
                <p className="text-sm text-muted-foreground">
                  No reported users match your filters.
                </p>
                <Button
                  variant="bordered"
                  onClick={handleClearFilters}
                  className="mt-4"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ReportedUsersTable
                reportedUsers={reportedUsers}
                currentPage={localCurrentPage}
                itemsPerPage={localItemsPerPage}
                sortField={localSortField}
                sortDirection={localSortDirection}
                onSort={handleSort}
                onAction={handleAction}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Page {localCurrentPage} of {totalPages} (Total: {totalElements} reported users)
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

export default ReportedUsers;
