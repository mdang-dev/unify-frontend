'use client';
import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Select,
  SelectItem,
  Button,
  Pagination,
  Tooltip,
  Chip,
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
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { usePostManagementStore } from '@/src/stores/post-management.store';

// Post status options
export const POST_STATUSES = [
  { key: '0', value: 'Hidden', color: 'danger' },
  { key: '1', value: 'Visible', color: 'success' },
  { key: '2', value: 'Sensitive/Violent', color: 'warning' },
];

// Audience options
export const AUDIENCE_OPTIONS = [
  { key: 'PUBLIC', value: 'Public' },
  { key: 'PRIVATE', value: 'Private' },
];

// Comment count operators
export const COMMENT_COUNT_OPERATORS = [
  { key: '=', value: 'Equal to' },
  { key: '>', value: 'Greater than' },
  { key: '<', value: 'Less than' },
  { key: '>=', value: 'Greater than or equal' },
  { key: '<=', value: 'Less than or equal' },
];

const PostManagement = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get state from store
  const {
    filters,
    currentPage,
    itemsPerPage,
    appliedFilters,
    cachedPosts,
    cachedHasNextPage,
    cachedCurrentPage,
    setFilters,
    setAppliedFilters,
    setPagination,
    setCachedData,
    clearCache,
    hasCachedData,
    getCachedState,
  } = usePostManagementStore();

  // Local state for immediate UI updates
  const [localFilters, setLocalFilters] = useState(filters);
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(itemsPerPage);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize local state from store on mount
  useEffect(() => {
    setLocalFilters(filters);
    setLocalCurrentPage(currentPage);
    setLocalItemsPerPage(itemsPerPage);
  }, [filters, currentPage, itemsPerPage]);

  // API call with pagination and filters
  const { data: postResponse, isLoading: loading, error, refetch, isFetching } = useQuery({
    queryKey: [QUERY_KEYS.POSTS, appliedFilters, currentPage, itemsPerPage],
    queryFn: () => postsQueryApi.getPostsWithFilters({
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
    if (postResponse && appliedFilters !== null) {
      setCachedData(postResponse);
    }
  }, [postResponse, appliedFilters, setCachedData]);

  // Extract data from response or cache
  const posts = postResponse?.posts || cachedPosts || [];
  const hasNextPage = postResponse?.hasNextPage || cachedHasNextPage || false;
  const responseCurrentPage = postResponse?.currentPage || cachedCurrentPage || 0;

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setAppliedFilters({ ...localFilters });
    setPagination(1, localItemsPerPage);
    setLocalCurrentPage(1);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      captions: '',
      status: '',
      audience: '',
      postedAt: '',
      isCommentVisible: '',
      isLikeVisible: '',
      hashtags: '',
      commentCount: '',
      commentCountOperator: '=',
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

  // Check if at least one filter is applied
  const hasActiveFilters = useMemo(() => {
    return Object.values(localFilters).some(value => 
      value !== '' && value !== null && value !== undefined && value !== '='
    );
  }, [localFilters]);

  const handleAction = (action, post) => {
    console.log(`${action} action for post:`, post);
    // Implement your action logic here
    if (action === 'view') {
      router.push(`/manage/posts/detail/${post.id}`);
    } else {
      alert(`${action} action for post: ${post.id}`);
    }
  };

  const getStatusInfo = (status) => {
    const statusInfo = POST_STATUSES.find(s => s.key === status.toString());
    return statusInfo || { value: 'Unknown', color: 'default' };
  };

  const getAudienceInfo = (audience) => {
    const audienceInfo = AUDIENCE_OPTIONS.find(a => a.key === audience);
    return audienceInfo || { value: audience };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="h-screen w-full px-6 pb-10">
      <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="w-1/2">
            <h1 className="text-4xl font-bold">Post Management</h1>
            <p className="text-gray-500">
              Manage all posts in the system with advanced filtering options.
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
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Filter Criteria</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Captions Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Captions</label>
                <Input
                  type="text"
                  placeholder="Enter caption text"
                  value={localFilters.captions}
                  onChange={(e) => handleFilterChange('captions', e.target.value)}
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
                  {POST_STATUSES.map((status) => (
                    <SelectItem key={status.key} value={status.key}>
                      {status.value}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Audience Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Audience</label>
                <Select
                  placeholder="Select audience"
                  value={localFilters.audience}
                  onChange={(e) => handleFilterChange('audience', e.target.value)}
                  className="w-full"
                >
                  {AUDIENCE_OPTIONS.map((audience) => (
                    <SelectItem key={audience.key} value={audience.key}>
                      {audience.value}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Posted At Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Posted At</label>
                <Input
                  type="datetime-local"
                  placeholder="Select date and time"
                  value={localFilters.postedAt}
                  onChange={(e) => handleFilterChange('postedAt', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Comment Visibility Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Comment Visibility</label>
                <Select
                  placeholder="Select comment visibility"
                  value={localFilters.isCommentVisible}
                  onChange={(e) => handleFilterChange('isCommentVisible', e.target.value)}
                  className="w-full"
                >
                  <SelectItem key="true" value="true">Visible</SelectItem>
                  <SelectItem key="false" value="false">Hidden</SelectItem>
                </Select>
              </div>

              {/* Like Visibility Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Like Visibility</label>
                <Select
                  placeholder="Select like visibility"
                  value={localFilters.isLikeVisible}
                  onChange={(e) => handleFilterChange('isLikeVisible', e.target.value)}
                  className="w-full"
                >
                  <SelectItem key="true" value="true">Visible</SelectItem>
                  <SelectItem key="false" value="false">Hidden</SelectItem>
                </Select>
              </div>

              {/* Hashtags Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Hashtags</label>
                <Input
                  type="text"
                  placeholder="Enter hashtags (comma separated)"
                  value={localFilters.hashtags}
                  onChange={(e) => handleFilterChange('hashtags', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Comment Count Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Comment Count</label>
                <div className="flex gap-2">
                  <Select
                    placeholder="Operator"
                    value={localFilters.commentCountOperator}
                    onChange={(e) => handleFilterChange('commentCountOperator', e.target.value)}
                    className="w-1/3"
                  >
                    {COMMENT_COUNT_OPERATORS.map((operator) => (
                      <SelectItem key={operator.key} value={operator.key}>
                        {operator.value}
                      </SelectItem>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    placeholder="Count"
                    value={localFilters.commentCount}
                    onChange={(e) => handleFilterChange('commentCount', e.target.value)}
                    className="w-2/3"
                  />
                </div>
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
        )}

        {/* Results Summary */}
        {appliedFilters && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {posts.length} posts
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
              tableHeaders={['No.', 'User', 'Captions', 'Status', 'Audience', 'Posted At', 'Comments', 'Actions']}
            />
          ) : error ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <h3 className="text-lg font-semibold text-red-600">Error Loading Data</h3>
                <p className="text-sm text-muted-foreground">
                  {error.message || 'An error occurred while loading post data'}
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
                  Apply filters to view post data
                </p>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <i className="fa-solid fa-search text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold text-muted-foreground">No Posts Found</h3>
                <p className="text-sm text-muted-foreground">
                  No posts match the applied filters
                </p>
              </div>
            </div>
          ) : (
            <>
              <ShadcnTable>
                <ShadcnTableHeader>
                  <ShadcnTableRow>
                    <TableHead className="w-[80px]">No.</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Captions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Posted At</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </ShadcnTableRow>
                </ShadcnTableHeader>
                <ShadcnTableBody>
                  {posts.map((post, index) => {
                    const statusInfo = getStatusInfo(post.status);
                    const audienceInfo = getAudienceInfo(post.audience);
                    
                    return (
                      <ShadcnTableRow key={post.id + index}>
                        <ShadcnTableCell className="font-medium">
                          {(localCurrentPage - 1) * localItemsPerPage + index + 1}
                        </ShadcnTableCell>
                        <ShadcnTableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {post.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <span className="text-sm font-medium">
                              {post.user?.username || 'Unknown User'}
                            </span>
                          </div>
                        </ShadcnTableCell>
                        <ShadcnTableCell>
                          <div className="max-w-xs truncate">
                            {post.captions || 'No caption'}
                          </div>
                        </ShadcnTableCell>
                        <ShadcnTableCell>
                          <Chip
                            color={statusInfo.color}
                            variant="flat"
                            size="sm"
                          >
                            {statusInfo.value}
                          </Chip>
                        </ShadcnTableCell>
                        <ShadcnTableCell>
                          <Chip
                            color={audienceInfo.key === 'PUBLIC' ? 'success' : 'warning'}
                            variant="flat"
                            size="sm"
                          >
                            {audienceInfo.value}
                          </Chip>
                        </ShadcnTableCell>
                        <ShadcnTableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(post.postedAt)}
                          </span>
                        </ShadcnTableCell>
                        <ShadcnTableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{post.commentCount || 0}</span>
                            {!post.isCommentVisible && (
                              <i className="fa-solid fa-eye-slash text-xs text-muted-foreground"></i>
                            )}
                          </div>
                        </ShadcnTableCell>
                        <ShadcnTableCell>
                          <div className="flex items-center gap-2">
                            <Tooltip content="View Details" placement="top">
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                color="primary"
                                onClick={() => handleAction('view', post)}
                              >
                                <i className="fa-solid fa-eye"></i>
                              </Button>
                            </Tooltip>
                            
                            <Tooltip content="Hide Post" placement="top">
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                color="warning"
                                onClick={() => handleAction('hide', post)}
                              >
                                <i className="fa-solid fa-eye-slash"></i>
                              </Button>
                            </Tooltip>
                            
                            <Tooltip content="Delete Post" placement="top">
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                color="danger"
                                onClick={() => handleAction('delete', post)}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </Button>
                            </Tooltip>
                          </div>
                        </ShadcnTableCell>
                      </ShadcnTableRow>
                    );
                  })}
                </ShadcnTableBody>
              </ShadcnTable>

              {/* Pagination */}
              {hasNextPage && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Page {localCurrentPage} of {responseCurrentPage + 1}
                  </div>
                  <Pagination
                    total={responseCurrentPage + 1}
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

export default PostManagement;
