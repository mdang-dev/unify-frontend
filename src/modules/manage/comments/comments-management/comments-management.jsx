'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import CommentDetailModal from './_components/comment-detail-modal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { reportsCommandApi } from '@/src/apis/reports/command/report.command.api';
import { reportsQueryApi } from '@/src/apis/reports/query/report.query.api';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';

export const STATUS_CLASSES = {
  0: 'text-blue-500 ',
  1: 'text-green-600 ',
  2: 'text-red-500 ',
};

export const STATUS_LABELS = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected',
};

const CommentsManagement = () => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    mutationFn: ({ reportId, status }) => reportsCommandApi.updateReport(reportId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORTS_COMMENTS] });
      closeModal();
    },
    onError: () => {
      alert('Failed to update report');
    },
  });

  const filteredReports = reports.filter((report) =>
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

  const handleApprove = () => {
    if (selectedReport) {
      updateReportMutation.mutate({ reportId: selectedReport.id, status: 1 });
    }
  };

  const handleReject = () => {
    if (selectedReport) {
      updateReportMutation.mutate({ reportId: selectedReport.id, status: 2 });
    }
  };

  return (
    <div className="h-screen w-[78rem] px-6 py-10">
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase">Reported Comments Management</h1>
          <p className="text-gray-500">Review and manage all reported comments on UNIFY.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by content, reporter, or comment author..."
            className="rounded-md border px-5 py-2 dark:bg-neutral-800 dark:text-white"
          />
        </div>
      </div>
      <div className="mt-5">
        <div className="no-scrollbar h-[calc(73vh-0.7px)] overflow-auto rounded-2xl p-4 shadow-md dark:shadow-[0_4px_6px_rgba(229,229,229,0.4)]">
          <div className="mb-4 flex items-center gap-2 text-blue-500 dark:text-blue-400">
            <Info size={20} />
            <p>Click on any row to view more details and take action</p>
          </div>
          <table className="min-w-full table-auto bg-white dark:bg-neutral-900">
            <thead className="sticky top-0 bg-gray-100 text-gray-500 shadow-inner dark:bg-neutral-800 dark:text-gray-300">
              <tr>
                <th className="w-[5%] px-2 py-3 pl-5 text-left">No.</th>
                <th className="w-[12%] px-2 py-3 text-left">Reporter</th>
                <th className="w-[18%] px-2 py-3 text-left">Comment Author</th>
                <th className="w-[25%] px-2 py-3 text-left">Reported Comment</th>

                <th className="w-[15%] px-2 py-3 text-left">Reported At</th>
                <th className="w-[8%] px-2 py-3 text-left">Status</th>
                <th className="w-[8%] px-2 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((report, index) => (
                <motion.tr
                  whileHover={{ scale: 1.01 }}
                  onClick={() => openModal(report)}
                  key={report.id}
                  className={`cursor-pointer transition-colors ${
                    index % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-gray-100 dark:bg-neutral-800'
                  }`}
                >
                  <td className="rounded-l-xl py-3 pl-5">{indexOfFirstItem + index + 1}</td>
                  <td className="px-2 py-3">{report.user?.username}</td>
                  <td className="px-2 py-3">{report.reportedEntity?.username}</td>
                  <td
                    className="max-w-[300px] truncate px-2 py-3"
                    title={report.reportedEntity?.content}
                  >
                    {report.reportedEntity?.content}
                  </td>

                  <td className="px-2 py-3">{new Date(report.reportedAt).toLocaleString()}</td>
                  <td className={`px-2 py-3 text-center ${STATUS_CLASSES[report.status]}`}>
                    {STATUS_LABELS[report.status] || report.status}
                  </td>

                  <td className="px-2 py-3">
                    {report.status === 0 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report);
                            setIsModalOpen(true);
                          }}
                          className="mr-1 rounded bg-green-500 px-2 py-1 text-white hover:bg-green-600"
                        >
                          Approve/Reject
                        </button>
                      </>
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
        loading={loading}
        postDetails={postDetails}
      />
    </div>
  );
};

export default CommentsManagement;
