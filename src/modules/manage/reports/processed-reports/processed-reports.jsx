'use client';
import React, { useState } from 'react';
import ToggleFilter from '../_components/toggle-filter';
import Pagination from '../_components/pagination';
import { useFetchApprovedReports } from '@/src/hooks/use-report';
import NavButton from '../_components/nav-button';

const ITEMS_PER_PAGE = 20;

const ProcessedReports = () => {
  const {
    data: approvedReports = [],
    isLoading,
    refetch: fetchApprovedReports,
  } = useFetchApprovedReports();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDescendingByType, setIsDescendingByType] = useState(true);
  const [isDescendingByReportDate, setIsDescendingByReportDate] = useState(true);

  // Returns the filtered and sorted reports based on search input and sort states
  const filteredAndSortedReports = useMemo(() => {
    if (!approvedReports) return [];

    const filtered = approvedReports.filter((report) =>
      (report.reportedId || '').toLowerCase().includes(search.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      const typeCompare = (a.entityType || '').localeCompare(b.entityType || '');
      const typeResult = isDescendingByType ? -typeCompare : typeCompare;
      if (typeResult !== 0) return typeResult;

      const dateA = a.reportedAt ? new Date(a.reportedAt).getTime() : 0;
      const dateB = b.reportedAt ? new Date(b.reportedAt).getTime() : 0;
      return isDescendingByReportDate ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [approvedReports, search, isDescendingByType, isDescendingByReportDate]);

  const totalPages = Math.ceil(filteredAndSortedReports.length / ITEMS_PER_PAGE);
  // Returns the current paginated reports for the selected page
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedReports, currentPage]);

  // Refetches approved reports and resets filters and search state
  const handleRefresh = () => {
    try {
      setSearch('');
      setIsDescendingByType(true);
      setIsDescendingByReportDate(true);
      fetchApprovedReports();
    } catch (err) {
      console.error('Failed to refresh reports:', err);
    }
  };

  return (
    <div className="h-screen w-[78rem] px-7 py-5">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-black">Processed Report Management (Approved)</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="rounded-md border border-blue-500 px-3 py-1 text-blue-500 hover:bg-blue-500 hover:text-white"
          >
            Refresh
          </button>
          <div className="rounded-md border border-red-500 px-3 py-1 text-red-500 hover:bg-red-500 hover:text-white">
            <NavButton iconClass="fa-regular fa-trash-can mr-2" content="Delete all" />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 px-4 py-2 hover:border-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:bg-black"
          placeholder="Search reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <NavButton
          iconClass="fa-solid fa-filter text-3xl dark:text-gray-400"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        />
        <ToggleFilter
          isFilterOpen={isFilterOpen}
          toggleTypeOrder={() => setIsDescendingByType((prev) => !prev)}
          toggleReportDateOrder={() => setIsDescendingByReportDate((prev) => !prev)}
          isDescendingByType={isDescendingByType}
          isDescendingByReportDate={isDescendingByReportDate}
        />
      </div>

      <div className="mt-5">
        {isLoading ? (
          <p>Loading reports...</p>
        ) : (
          <div className="rounded-lg shadow-md">
            <table className="min-w-full table-auto bg-white dark:bg-neutral-900">
              <thead className="sticky top-0 bg-gray-200 shadow-inner dark:bg-neutral-800">
                <tr>
                  <th className="w-[5%] px-2 py-3 text-left">STT</th>
                  <th className="w-[30%] px-2 py-3 text-left">REPORTED ID</th>
                  <th className="w-[15%] px-2 py-3 text-left">TYPE</th>
                  <th className="w-[15%] px-2 py-3 text-left">REPORTER</th>
                  <th className="w-[11%] px-2 py-3 text-left">REPORT DATE</th>
                  <th className="w-[11%] px-2 py-3 text-left">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map((report, index) => (
                  <tr key={report.id} className="hover:bg-gray-100 dark:hover:bg-neutral-700">
                    <td className="px-2 py-3">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="max-w-[30%] truncate px-2 py-3">{report.reportedId || 'N/A'}</td>
                    <td className="max-w-[15%] truncate px-2 py-3">{report.entityType || 'N/A'}</td>
                    <td className="max-w-[15%] truncate px-2 py-3">{report.userId || 'N/A'}</td>
                    <td className="max-w-[11%] truncate px-2 py-3">{report.reportedAt || 'N/A'}</td>
                    <td className="max-w-[11%] truncate px-2 py-3">
                      {report.status === 1
                        ? 'Approved'
                        : report.status === 2
                          ? 'Rejected'
                          : 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
};

export default ProcessedReports;
