'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from '@heroui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminReportsQueryApi } from '@/src/apis/reports/query/admin-reports.query.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import ReportedPostsFilters from './_components/reported-posts-filters';
import ReportedPostsTable from './_components/reported-posts-table';

const ReportedPosts = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '0', // Default to pending reports
    reportedAtFrom: '',
    reportedAtTo: '',
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
  });

  // Fetch reported posts data
  const { data: reportedPostsData, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.REPORTED_POSTS, filters, pagination],
    queryFn: () => adminReportsQueryApi.getReportedPosts({
      ...filters,
      ...pagination,
    }),
  });

  const reportedPosts = useMemo(() => {
    return reportedPostsData?.content || [];
  }, [reportedPostsData]);

  const totalPages = useMemo(() => {
    return reportedPostsData?.totalPages || 0;
  }, [reportedPostsData]);

  const totalElements = useMemo(() => {
    return reportedPostsData?.totalElements || 0;
  }, [reportedPostsData]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleAction = (action, report) => {
    switch (action) {
      case 'reports':
        router.push(`/manage/posts/reports/${report.reportedId}`);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full px-6 pb-10">
        <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full px-6 pb-10">
        <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error Loading Reports</h3>
              <p className="text-sm text-muted-foreground">
                {error.message || 'An error occurred while loading reported posts'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full px-6 pb-10">
      <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Reported Posts</h1>
            <p className="text-muted-foreground">
              Manage and review reported posts from users
            </p>
          </div>
          <Button
            variant="bordered"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        {showFilters && (
          <ReportedPostsFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        )}

        <div className="rounded-lg border bg-card">
          <ReportedPostsTable
            reportedPosts={reportedPosts}
            onAction={handleAction}
            pagination={pagination}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportedPosts;
