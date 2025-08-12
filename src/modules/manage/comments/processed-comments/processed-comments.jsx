'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CommentDetailModal from '../comments-management/_components/comment-detail-modal';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { reportsQueryApi } from '@/src/apis/reports/query/report.query.api';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';

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

const ProcessedComments = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'approved', 'rejected'
  const itemsPerPage = 20;

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

  // Filter reports to show only processed ones (status 1 or 2)
  const processedReports = reports.filter((report) => report.status === 1 || report.status === 2);

  // Apply status filter
  const filteredByStatus = processedReports.filter((report) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'approved') return report.status === 1;
    if (statusFilter === 'rejected') return report.status === 2;
    return true;
  });

  // Apply search filter
  const filteredReports = filteredByStatus.filter((report) =>
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
  const getStatusIcon = (status) => {
    if (status === 1) {
      return <CheckCircle className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />;
    } else if (status === 2) {
      return <XCircle className="h-4 w-4 text-zinc-200 dark:text-zinc-800" />;
    }
    return null;
  };

  const getStatusBadgeColor = (status) => {
    if (status === 1) {
      return 'inline-flex items-center rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-neutral-800 dark:text-zinc-200';
    } else if (status === 2) {
      return 'inline-flex items-center rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-zinc-200 dark:bg-neutral-200 dark:text-zinc-800';
    }
    return 'inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200';
  };

  return (
    <div className="h-screen w-[78rem] px-6 py-10">
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase">Processed Comments</h1>
          <p className="text-gray-500">View all comment processed on UNIFY.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex gap-1.5">
            {[
              { slot: 'all', label: 'All Processed' },
              { slot: 'approved', label: 'Approved Only' },
              { slot: 'rejected', label: 'Rejected Only' },
            ].map(({ slot, label }) => (
              <button
                key={slot}
                data-slot={slot}
                onClick={() => setStatusFilter(slot)}
                className={`relative rounded-md border px-2 py-1 text-xs font-medium transition-all duration-300 ease-in-out ${
                  statusFilter === slot
                    ? 'bg-neutral-600 text-white dark:bg-neutral-400 dark:text-neutral-900'
                    : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-600 hover:text-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-600 dark:hover:text-white'
                } animate-pulse-once hover:scale-[1.01] focus:scale-[1.02] focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by content, reporter, or comment author..."
            className="rounded-md border px-5 py-2 dark:bg-neutral-800 dark:text-white"
          />
          <Link
            href="/manage/comments/list"
            className="rounded-md bg-neutral-800 px-4 py-2 text-sm text-center font-medium text-white transition-colors hover:bg-zinc-100 hover:text-neutral-700 dark:bg-zinc-100 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
          >
            View Pending Comments
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-neutral-900 dark:shadow-neutral-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Total Processed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                {processedReports.length}
              </p>
            </div>
            <div className="rounded-full bg-neutral-800 p-3 dark:bg-zinc-200">
              <Info className="h-6 w-6 text-zinc-200 dark:text-neutral-800" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-neutral-900 dark:shadow-neutral-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Approved</p>
              <p className="text-2xl font-bold text-neutral-700 dark:text-neutral-200">
                {processedReports.filter((r) => r.status === 1).length}
              </p>
            </div>
            <div className="rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
              <CheckCircle className="h-6 w-6 text-neutral-600 dark:text-neutral-300" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-neutral-900 dark:shadow-neutral-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Rejected</p>
              <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                {processedReports.filter((r) => r.status === 2).length}
              </p>
            </div>
            <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
              <XCircle className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="no-scrollbar h-[calc(60vh-0.7px)] overflow-auto rounded-2xl bg-white p-4 shadow-md dark:bg-neutral-900 dark:shadow-md dark:shadow-neutral-800/50">
          <div className="text-neutral-500-500 mb-4 flex items-center gap-2 dark:text-zinc-300">
            <Info size={20} />
            <p>Click on any row to view more details</p>
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
                <th className="w-[10%] px-4 py-3 text-left text-sm font-semibold">Action</th>
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
                  <td className="px-4 py-3 text-center text-sm">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(report.status)}`}
                    >
                      {getStatusIcon(report.status)}
                      {STATUS_LABELS[report.status] || report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-xs text-gray-500 dark:text-neutral-400">
                      {report.status === 1 ? '✓ Processed' : 'X Processed'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {currentItems.length === 0 && (
            <div className="flex h-32 items-center justify-center">
              <p className="text-gray-500 dark:text-neutral-400">
                {statusFilter === 'all'
                  ? 'No processed comments found.'
                  : statusFilter === 'approved'
                    ? 'No approved comments found.'
                    : 'No rejected comments found.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <CommentDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        comment={selectedReport}
        onApprove={() => {}} // No actions for processed comments
        onReject={() => {}} // No actions for processed comments
        loading={false}
        postDetails={postDetails}
      />
    </div>
  );
};

export default ProcessedComments;
