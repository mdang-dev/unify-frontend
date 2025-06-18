'use client';
import React, { useState, useEffect } from 'react';
import ToggleFilter from '../_components/toggle-filter';
import Pagination from '../_components/pagination';
import ModalPost from '../_components/modal-post';
import ModalUser from '../_components/modal-user';
import { addToast } from '@heroui/toast';
import NavButton from '../_components/nav-button';
import { useFetchPendingReports } from '@/src/hooks/use-report';
import { useMutation } from '@tanstack/react-query';
import { reportsCommandApi } from '@/src/apis/reports/command/report.command.api';

const VerifyReports = () => {
  const {
    data: pendingReports,
    isLoading: loading,
    refetch: fetchPendingReports,
  } = useFetchPendingReports();
  const [filteredReports, setFilteredReports] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 20;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDescendingByType, setIsDescendingByType] = useState(true);
  const [isDescendingByReportDate, setIsDescendingByReportDate] = useState(true);
  const { mutate: updateReport } = useMutation({
    mutationFn: ({ reportId, status }) => reportsCommandApi.updateReport(reportId, status),
  });

  const toggleFilter = () => setIsFilterOpen(!isFilterOpen);
  const toggleTypeOrder = () => setIsDescendingByType((prev) => !prev);
  const toggleReportDateOrder = () => setIsDescendingByReportDate((prev) => !prev);

  useEffect(() => {
    let updatedReports = [...pendingReports];

    updatedReports = updatedReports.filter((report) =>
      (report.reportedId || '').toLowerCase().includes(search.toLowerCase())
    );

    updatedReports.sort((a, b) => {
      const typeComparison = isDescendingByType
        ? (b.entityType || '').localeCompare(a.entityType || '')
        : (a.entityType || '').localeCompare(b.entityType || '');

      if (typeComparison === 0) {
        const dateA = new Date(a.reportedAt || '');
        const dateB = new Date(b.reportedAt || '');
        return isDescendingByReportDate ? dateB - dateA : dateA - dateB;
      }

      return typeComparison;
    });

    setFilteredReports(updatedReports);
    setCurrentPage(1);
  }, [pendingReports, search, isDescendingByType, isDescendingByReportDate]);

  const handleUpdateStatus = (reportId, status) => {
    updateReport(
      { reportId, status },
      {
        onSuccess: async () => {
          await fetchPendingReports();
          addToast({
            title: 'Success',
            description: 'Report status updated successfully.',
            timeout: 3000,
            shouldShowTimeoutProgess: true,
            color: 'success',
          });
        },
        onError: () => {
          addToast({
            title: 'Failed',
            description: 'Failed to update report status.',
            timeout: 3000,
            shouldShowTimeoutProgess: true,
            color: 'warning',
          });
        },
      }
    );
  };

  const openModal = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const handleRefresh = async () => {
    setSearch('');
    setIsDescendingByType(true);
    setIsDescendingByReportDate(true);
    fetchPendingReports();
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  return (
    <>
      <div className="h-screen w-[78rem] px-7 py-5">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-black">Verify Report Management (Pending)</h1>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="rounded-md border border-blue-500 px-3 py-1 text-blue-500 hover:bg-blue-500 hover:text-white"
            >
              Refresh
            </button>
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
            onClick={toggleFilter}
          />
          <ToggleFilter
            isFilterOpen={isFilterOpen}
            toggleTypeOrder={toggleTypeOrder}
            toggleReportDateOrder={toggleReportDateOrder}
            isDescendingByType={isDescendingByType}
            isDescendingByReportDate={isDescendingByReportDate}
          />
        </div>

        <div className="mt-5">
          {loading ? (
            <p>Loading reports...</p>
          ) : (
            <div className="rounded-lg shadow-md">
              <table className="min-w-full table-auto bg-white dark:bg-neutral-900">
                <thead className="sticky top-0 bg-gray-200 shadow-inner dark:bg-neutral-800">
                  <tr>
                    <th className="w-[5%] px-2 py-3 text-left">STT</th>
                    <th className="w-[30%] px-2 py-3 text-left">REPORTED</th>
                    <th className="w-[15%] px-2 py-3 text-left">TYPE</th>
                    <th className="w-[11%] px-2 py-3 text-left">REPORT DATE</th>
                    <th className="w-[20%] px-2 py-3 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((report, index) => (
                    <tr key={report.id} className="hover:bg-gray-100 dark:hover:bg-neutral-700">
                      <td className="px-2 py-3">{indexOfFirstItem + index + 1}</td>
                      <td
                        className="max-w-[30%] cursor-pointer truncate px-2 py-3 text-blue-500 hover:underline"
                        onClick={() => openModal(report)}
                      >
                        {report.reportedId || ''}
                      </td>
                      <td className="max-w-[15%] truncate px-2 py-3">{report.entityType || ''}</td>
                      <td className="max-w-[11%] truncate px-2 py-3">{report.reportedAt || ''}</td>
                      <td className="flex justify-center gap-2 py-2 text-center">
                        <button
                          className="rounded-md border border-green-500 px-3 py-1 text-green-500 hover:bg-green-500 hover:text-white"
                          onClick={() => handleUpdateStatus(report.id, 1)}
                        >
                          Approve
                        </button>
                        <button
                          className="rounded-md border border-red-500 px-3 py-1 text-red-500 hover:bg-red-500 hover:text-white"
                          onClick={() => handleUpdateStatus(report.id, 2)}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {selectedReport?.entityType === 'POST' ? (
          <ModalPost report={selectedReport} isOpen={isModalOpen} onClose={closeModal} />
        ) : selectedReport?.entityType === 'USER' ? (
          <ModalUser report={selectedReport} isOpen={isModalOpen} onClose={closeModal} />
        ) : null}
      </div>
    </>
  );
};

export default VerifyReports;
