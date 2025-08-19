'use client';
import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Chip,
} from '@heroui/react';
import { MoreVertical, Eye } from 'lucide-react';

const ReportedPostsTable = ({
  reportedPosts,
  onAction,
  pagination,
  totalPages,
  totalElements,
  onPageChange,
}) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 0:
        return { label: 'Pending', color: 'warning' };
      case 1:
        return { label: 'Approved', color: 'success' };
      case 2:
        return { label: 'Rejected', color: 'danger' };
      case 3:
        return { label: 'Resolved', color: 'info' };
      case 4:
        return { label: 'Canceled', color: 'warning' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'No caption';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const renderCell = (report, columnKey) => {
    const statusInfo = getStatusInfo(report.sampleStatus);

    switch (columnKey) {
      case 'post':
        return (
          <div className="flex flex-col">
            <div className="font-medium">{truncateText(report.displayLabel)}</div>
            <div className="text-sm text-muted-foreground">ID: {report.reportedId}</div>
          </div>
        );
      case 'reportCount':
        return (
          <div className="text-center">
            <span className="text-lg font-semibold">{report.reportCount}</span>
          </div>
        );
      case 'status':
        return (
          <Chip color={statusInfo.color} variant="flat" size="sm">
            {statusInfo.label}
          </Chip>
        );
      case 'latestReportedAt':
        return (
          <div className="text-sm">
            {formatDate(report.latestReportedAt)}
          </div>
        );
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Actions"
              onAction={(key) => onAction(key, report)}
            >
              <DropdownItem
                key="reports"
                description="View detailed reports"
                startContent={<Eye className="h-4 w-4" />}
              >
                View Reports
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return null;
    }
  };

  const columns = [
    { name: 'POST', uid: 'post' },
    { name: 'REPORT COUNT', uid: 'reportCount' },
    { name: 'STATUS', uid: 'status' },
    { name: 'LATEST REPORTED', uid: 'latestReportedAt' },
    { name: 'ACTIONS', uid: 'actions' },
  ];

  return (
    <div>
      <Table aria-label="Reported posts table">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={reportedPosts}
          emptyContent={reportedPosts.length === 0 ? 'No reported posts found' : null}
        >
          {(report) => (
            <TableRow key={report.reportedId}>
              {(columnKey) => (
                <TableCell>{renderCell(report, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center py-4">
          <Pagination
            total={totalPages}
            page={pagination.page + 1}
            onChange={(page) => onPageChange(page - 1)}
            showControls
            showShadow
            color="primary"
          />
        </div>
      )}

      {totalElements > 0 && (
        <div className="px-6 py-2 text-sm text-muted-foreground">
          Showing {pagination.page * pagination.size + 1} to{' '}
          {Math.min((pagination.page + 1) * pagination.size, totalElements)} of{' '}
          {totalElements} results
        </div>
      )}
    </div>
  );
};

export default ReportedPostsTable;
