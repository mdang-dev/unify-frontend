'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CommentDetailModal from './_components/comment-detail-modal';
import ConfirmationModal from './_components/confirmation-modal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { reportsCommandApi } from '@/src/apis/reports/command/report.command.api';
import { reportsQueryApi } from '@/src/apis/reports/query/report.query.api';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { addToast } from '@heroui/toast';

export const STATUS_CLASSES = {
  0: 'text-zinc-600 dark:text-zinc-300',
  1: 'text-neutral-700 dark:text-neutral-200',
  2: 'text-neutral-600 dark:text-neutral-400',
};
export const STATUS_LABELS = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected',
};

const CommentsManagement = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    action: null,
    title: '',
    message: '',
    confirmText: '',
    confirmColor: '',
  });
  const itemsPerPage = 20;

  const queryClient = useQueryClient();

  // Fetch all reports
  const { data: reports = [], isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.REPORTS_COMMENTS],
    queryFn: reportsQueryApi.getAllReportComments,
  });

  const { data: postDetails } = useQuery({
    queryKey: ['post-details', selectedReport?.reportedEntity?.postId],
    queryFn: () => postsQueryApi.getPostDetails(selectedReport.reportedEntity.postId),
    enabled: !!selectedReport?.reportedEntity?.postId,
  });

  // Update report status
  const updateReportMutation = useMutation({
    mutationFn: ({ reportId, status, adminReason }) =>
      reportsCommandApi.updateReportWithAdminReason(reportId, status, adminReason),
  });

  // Filter reports to show only pending ones (status 0)
  const pendingReports = reports.filter((report) => report.status === 0);

  const filteredReports = pendingReports.filter((report) =>
    [report.reportedEntity?.content, report.user?.username, report.reportedEntity?.username]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  const openModal = async (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const showConfirmationModal = (action, title, message, confirmText, confirmColor) => {
    setConfirmationModal({
      isOpen: true,
      action,
      title,
      message,
      confirmText,
      confirmColor,
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      action: null,
      title: '',
      message: '',
      confirmText: '',
      confirmColor: '',
    });
  };

  const handleConfirmAction = () => {
    if (confirmationModal.action === 'approve') {
      handleApproveAction();
    } else if (confirmationModal.action === 'reject') {
      handleRejectAction();
    }
    closeConfirmationModal();
  };

  const handleApprove = () => {
    showConfirmationModal(
      'approve',
      'Approve Comment Report',
      'Are you sure you want to approve this comment report? This action will mark the report as approved.',
      'Approve',
      'bg-neutral-700 hover:bg-neutral-800'
    );
  };

  const handleReject = () => {
    showConfirmationModal(
      'reject',
      'Reject Comment Report',
      'Are you sure you want to reject this comment report? This action will mark the report as rejected.',
      'Reject',
      'bg-zinc-600 hover:bg-zinc-700'
    );
  };

  const handleApproveAction = () => {
    if (selectedReport) {
      // Optimistically update the UI
      queryClient.setQueryData([QUERY_KEYS.REPORTS_COMMENTS], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((report) =>
          report.id === selectedReport.id ? { ...report, status: 1 } : report
        );
      });

      updateReportMutation.mutate(
        {
          reportId: selectedReport.id,
          status: 1,
          adminReason: 'Comment approved by admin',
        },
        {
          onSuccess: () => {
            addToast({
              title: 'Success',
              description: 'Comment report approved successfully.',
              timeout: 3000,
              color: 'success',
            });
            closeModal();
          },
          onError: (error) => {
            console.error('Failed to approve report:', error);
            // Revert optimistic update on error
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORTS_COMMENTS] });
            addToast({
              title: 'Error',
              description: 'Failed to approve report. Please try again.',
              timeout: 3000,
              color: 'danger',
            });
          },
        }
      );
    }
  };

  const handleRejectAction = () => {
    if (selectedReport) {
      // Optimistically update the UI
      queryClient.setQueryData([QUERY_KEYS.REPORTS_COMMENTS], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((report) =>
          report.id === selectedReport.id ? { ...report, status: 2 } : report
        );
      });

      updateReportMutation.mutate(
        {
          reportId: selectedReport.id,
          status: 2,
          adminReason: 'Comment rejected by admin',
        },
        {
          onSuccess: () => {
            addToast({
              title: 'Success',
              description: 'Comment report rejected successfully.',
              timeout: 3000,
              color: 'success',
            });
            closeModal();
          },
          onError: (error) => {
            console.error('Failed to reject report:', error);
            // Revert optimistic update on error
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORTS_COMMENTS] });
            addToast({
              title: 'Error',
              description: 'Failed to reject report. Please try again.',
              timeout: 3000,
              color: 'danger',
            });
          },
        }
      );
    }
  };

  return (
    <div className="h-screen w-[78rem] px-6 py-10">
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase">Pending Comments </h1>
          <p className="text-neutral-400">Review and manage pending comment reports on UNIFY.</p>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded-md border px-5 py-2 dark:bg-neutral-800 dark:text-neutral-400"
          />
          <Link
            href="/manage/comments/processed"
            className="rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-100 hover:text-neutral-700 dark:bg-zinc-100 dark:text-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
          >
            View Processed Comments
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-neutral-900 dark:shadow-neutral-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Pending Comments</p>
              <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                {pendingReports.length}
              </p>
            </div>
            <div className="rounded-full bg-neutral-800 p-3 dark:bg-zinc-200">
              <Info className="h-6 w-6 text-zinc-200 dark:text-neutral-800"  />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-neutral-900 dark:shadow-neutral-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Total Reports</p>
              <p className="text-2xl font-bold text-zinc-700 dark:text-neutral-100 ">
                {reports.length}
              </p>
            </div>
            <div className="rounded-full bg-gray-100 p-3 dark:bg-neutral-700">
              <Info className="h-6 w-6 text-zinc-600 dark:text-zinc-200" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="no-scrollbar h-[calc(60vh-0.7px)] overflow-auto rounded-2xl bg-white p-4 shadow-md dark:bg-neutral-900 dark:shadow-md dark:shadow-neutral-800/50">
          <div className="text-neutral-500-500 mb-4 flex items-center gap-2 dark:text-zinc-300">
            <Info size={20} />
            <p>Click on any row to view more details and take action on pending reports</p>
          </div>
          <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-neutral-700">
            <thead className="sticky top-0 z-10 w-full bg-neutral-800 text-zinc-200 dark:bg-neutral-200 dark:text-zinc-800">
              <tr>
                <th className="w-[5%] px-4 py-3 text-left text-sm font-semibold">No.</th>
                <th className="w-[12%] px-4 py-3 text-left text-sm font-semibold">Reporter</th>
                <th className="w-[18%] px-4 py-3 text-left text-sm font-semibold">
                  Comment Author
                </th>
                <th className="w-[25%] px-4 py-3 text-left text-sm font-semibold">
                  Reported Comment
                </th>
                <th className="w-[15%] px-4 py-3 text-left text-sm font-semibold">Reported At</th>
                <th className="w-[8%] px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="w-[8%] px-4 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {currentItems.map((report, index) => (
                <motion.tr
                  whileHover={{ scale: 1.01 }}
                  onClick={() => openModal(report)}
                  key={report.id}
                  className={`cursor-pointer transition-all duration-300 hover:bg-gray-100 dark:hover:bg-neutral-800 ${
                    index % 2 === 0
                      ? 'bg-white dark:bg-neutral-900'
                      : 'bg-gray-50 dark:bg-neutral-800'
                  } ${
                    report.status === 1
                      ? 'ring-2 ring-emerald-200 dark:ring-emerald-800'
                      : report.status === 2
                        ? 'ring-2 ring-rose-200 dark:ring-rose-800'
                        : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-neutral-100">
                    {indexOfFirstItem + index + 1}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-neutral-100">
                    {report.user?.username}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-neutral-100">
                    {report.reportedEntity?.username}
                  </td>
                  <td
                    className="max-w-[300px] truncate px-4 py-3 text-sm text-gray-900 dark:text-neutral-100"
                    title={report.reportedEntity?.content}
                  >
                    {report.reportedEntity?.content}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-neutral-100">
                    {new Date(report.reportedAt).toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 text-center text-sm ${STATUS_CLASSES[report.status]}`}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium dark:bg-neutral-800">
                      {STATUS_LABELS[report.status] || report.status}
                      {report.status === 1 && <span className="text-xs">✓</span>}
                      {report.status === 2 && <span className="text-xs">✗</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {report.status === 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                          setIsModalOpen(true);
                        }}
                        className="mr-1 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors duration-200 hover:border-neutral-400 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-zinc-200 dark:text-neutral-800 dark:hover:text-zinc-200 dark:hover:border-neutral-500 dark:hover:bg-neutral-700"
                      >
                        Approve/Reject
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-neutral-400">
                        {report.status === 1 ? '✓ Processed' : '✗ Processed'}
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <CommentDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        comment={selectedReport}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={updateReportMutation.isPending}
        postDetails={postDetails}
      />
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmAction}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        confirmColor={confirmationModal.confirmColor}
        loading={updateReportMutation.isPending}
      />
    </div>
  );
};

export default CommentsManagement;
