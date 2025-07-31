'use client';
import React, { useState, useEffect } from 'react';
import ModalPost from '../../reports/_components/modal-post';
import ModalUser from '../../reports/_components/modal-user';
import { addToast } from '@heroui/toast';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useFetchPendingReports, useFetchApprovedReports } from '@/src/hooks/use-report';
import { reportsCommandApi } from '@/src/apis/reports/command/report.command.api';
import ConfirmModal from './_components/confirm-modal';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import AdminReasonModal from '../../_components/admin-reason-modal';

const ReportUsers = () => {
  const {
    data: pendingReports = [],
    isLoading: loadingPending,
    refetch: fetchPendingReports,
  } = useFetchPendingReports();

  const {
    data: approvedReports = [],
    isLoading: loadingApproved,
    refetch: fetchApprovedReports,
  } = useFetchApprovedReports();

  const loading = loadingPending || loadingApproved;
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const itemsPerPage = 20;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [isAdminReasonOpen, setIsAdminReasonOpen] = useState(false);
  const [adminReasonAction, setAdminReasonAction] = useState(null);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const { mutate: updateReport } = useMutation({
    mutationFn: ({ reportId, status, reason }) =>
      reportsCommandApi.updateReportWithReason(reportId, status, reason),
  });

  const { mutate: adminReason } = useMutation({
    mutationFn: ({ reportId, status, adminReason }) =>
      reportsCommandApi.updateReportWithAdminReason(reportId, status, adminReason),
  });

  const reportsToShow = dateFilter === 'approvedReport' ? approvedReports : pendingReports;

  const filteredReports = useMemo(() => {
    let reports = [...reportsToShow];

    reports = reports.filter((report) =>
      (report.reportedId || '').toLowerCase().includes(search.toLowerCase())
    );

    const now = new Date();
    reports = reports.filter((report) => {
      const reportedDate = new Date(report.reportedAt || '');
      if (!report.reportedAt) return false;

      switch (dateFilter) {
        case 'today':
          return reportedDate.toDateString() === now.toDateString();
        case '1month':
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
          return reportedDate >= oneMonthAgo;
        case '3months':
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          return reportedDate >= threeMonthsAgo;
        case 'approvedReport':
          return report.status == 1;
        default:
          return true;
      }
    });

    return reports;
  }, [reportsToShow, search, dateFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFilter]);

  const handleUpdateStatus = async (reportId, status, reason) => {
    setIsButtonLoading(true);
    updateReport(
      { reportId, status, reason },
      {
        onSuccess: async () => {
          await fetchPendingReports();
          addToast({
            title: 'Success',
            description: 'Report status updated successfully.',
            timeout: 3000,
            color: 'success',
          });
        },
        onError: () => {
          addToast({
            title: 'Failed',
            description: 'Failed to update report status.',

            color: 'warning',
          });
        },
        onSettled: () => setIsButtonLoading(false),
      }
    );
  };

  const openAdminReasonModal = (reportId, action) => {
    setSelectedReportId(reportId);
    setAdminReasonAction(action);
    setIsAdminReasonOpen(true);
  };

  const handleAdminReasonConfirm = async (reason) => {
    setIsButtonLoading(true);
    const status = adminReasonAction === 'approve' ? 1 : 2;
    adminReason(
      { reportId: selectedReportId, status, adminReason: reason },
      {
        onSuccess: async () => await fetchPendingReports(),
        onError: (err) => console.error('Failed to update status:', err),
        onSettled: () => {
          setIsButtonLoading(false);
          setIsAdminReasonOpen(false);
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

  const openConfirmModal = (reportId, action) => {
    setSelectedReportId(reportId);
    setConfirmAction(action);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedReportId(null);
    setConfirmAction(null);
  };

  const handleConfirmAction = (reason) => {
    const status = confirmAction === 'approve' ? 1 : 2;
    handleUpdateStatus(selectedReportId, status, reason);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <>
      <div className="h-screen w-[78rem] px-6 py-10">
        <div className="flex w-full items-center justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase">Reported Users</h1>
            <p className="text-gray-500">
              Manage all reports about users that violated UNIFY&apos;s policies.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="1month">Within the past month</option>
              <option value="3months">Within the past three months</option>
              <option value="approvedReport">Approved report</option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <p>Loading reports...</p>
          ) : (
            <div className="no-scrollbar h-[calc(73vh-0.7px)] overflow-auto rounded-2xl p-4 shadow-md dark:shadow-[0_4px_6px_rgba(229,229,229,0.4)]">
              <div className="mb-4 flex items-center gap-2 text-blue-500 dark:text-blue-400">
                <Info size={20} />
                <p>Click on any row to view more details</p>
              </div>
              <table className="min-w-full table-auto bg-white dark:bg-neutral-900">
                <thead className="sticky top-0 bg-gray-100 text-gray-500 shadow-inner dark:bg-neutral-800 dark:text-gray-300">
                  <tr>
                    <th className="w-[5%] px-2 py-3 pl-5 text-left">No.</th>
                    <th className="w-[30%] px-2 py-3 text-left">Reason</th>
                    <th className="w-[11%] px-2 py-3 text-left">Report at</th>
                    <th className="w-[20%] px-2 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((report, index) => (
                    <motion.tr
                      whileHover={{ scale: 1.01 }}
                      onClick={() => openModal(report)}
                      key={report.id}
                      className={`cursor-pointer transition-colors ${
                        index % 2 === 0
                          ? 'bg-white dark:bg-black'
                          : 'bg-gray-100 dark:bg-neutral-800'
                      }`}
                    >
                      <td className="rounded-l-xl py-3 pl-5">{indexOfFirstItem + index + 1}</td>
                      <td
                        className="max-w-[500px] truncate px-2 py-3"
                        style={{ textOverflow: 'ellipsis' }}
                        title={report.reason}
                      >
                        {report.reason || ''}
                      </td>
                      <td className="max-w-[11%] truncate px-2 py-3">
                        {report.reportedAt
                          ? new Date(report.reportedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : ''}
                      </td>

                      <td className="rounded-r-xl py-2 text-center">
                        <button
                          className={`mr-2 rounded-md border px-3 py-1 ${
                            report.status === 0
                              ? 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white'
                              : 'cursor-not-allowed border-gray-400 text-gray-400'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (report.status === 0) {
                              openAdminReasonModal(report.id, 'approve');
                            }
                          }}
                          disabled={report.status !== 0 || isButtonLoading}
                        >
                          Approve
                        </button>

                        <button
                          className={`rounded-md border px-3 py-1 ${
                            report.status === 0
                              ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                              : 'cursor-not-allowed border-gray-400 text-gray-400'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (report.status === 0) {
                              openAdminReasonModal(report.id, 'reject');
                            }
                          }}
                          disabled={report.status !== 0 || isButtonLoading}
                        >
                          Reject
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedReport?.entityType === 'POST' ? (
          <ModalPost report={selectedReport} isOpen={isModalOpen} onClose={closeModal} />
        ) : selectedReport?.entityType === 'USER' ? (
          <ModalUser report={selectedReport} isOpen={isModalOpen} onClose={closeModal} />
        ) : null}

        <AdminReasonModal
          isOpen={isAdminReasonOpen}
          onClose={() => setIsAdminReasonOpen(false)}
          onConfirm={handleAdminReasonConfirm}
          action={adminReasonAction}
          isLoading={isButtonLoading}
        />
      </div>
    </>
  );
};

export default ReportUsers;
