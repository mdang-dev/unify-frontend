'use client';
import React from 'react';
import {
  Button,
  Tooltip,
  Badge,
} from '@heroui/react';
import {
  Table as ShadcnTable,
  TableBody as ShadcnTableBody,
  TableCell as ShadcnTableCell,
  TableHead,
  TableHeader as ShadcnTableHeader,
  TableRow as ShadcnTableRow,
} from '@/src/components/ui/table';
import { ChevronUpIcon, ChevronDownIcon, Eye } from 'lucide-react';

const ReportedUsersTable = ({ 
  reportedUsers, 
  currentPage, 
  itemsPerPage, 
  sortField, 
  sortDirection, 
  onSort, 
  onAction 
}) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 0:
        return { label: 'Pending', color: 'default' };
      case 1:
        return { label: 'Approved', color: 'success' };
      case 2:
        return { label: 'Rejected', color: 'danger' };
      case 3:
        return { label: 'Resolved', color: 'primary' };
      case 4:
        return { label: 'Canceled', color: 'default' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
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

  const formatDateISO = (dateString) => {
    if (!dateString) return 'Not specified';
    return dateString;
  };

  const SortableHeader = ({ field, children }) => {
    const isActive = sortField === field;
    const isAsc = isActive && sortDirection === 'asc';
    
    return (
      <button
        onClick={() => onSort(field, isActive ? (isAsc ? 'desc' : 'asc') : 'desc')}
        className="flex items-center gap-1 hover:text-primary"
      >
        {children}
        {isActive && (
          isAsc ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
        )}
      </button>
    );
  };

  return (
    <ShadcnTable>
      <ShadcnTableHeader>
        <ShadcnTableRow>
          <TableHead className="w-[80px]">No.</TableHead>
          <TableHead>User</TableHead>
          <TableHead>
            <SortableHeader field="reportCount">Reports</SortableHeader>
          </TableHead>
          <TableHead>
            <SortableHeader field="latestReportedAt">Latest Reported At</SortableHeader>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[120px]">Actions</TableHead>
        </ShadcnTableRow>
      </ShadcnTableHeader>
      <ShadcnTableBody>
        {reportedUsers.map((report, index) => {
          const statusInfo = getStatusInfo(report.sampleStatus);
          const displayName = report.displayLabel || report.reportedId;
          
          return (
            <ShadcnTableRow key={report.reportedId + index}>
              <ShadcnTableCell className="font-medium">
                {(currentPage - 1) * itemsPerPage + index + 1}
              </ShadcnTableCell>
              <ShadcnTableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{displayName}</span>
                  {report.displayLabel && (
                    <span className="text-sm text-muted-foreground">{report.reportedId}</span>
                  )}
                </div>
              </ShadcnTableCell>
              <ShadcnTableCell>
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {report.reportCount}
                </Badge>
              </ShadcnTableCell>
              <ShadcnTableCell>
                <Tooltip content={formatDateISO(report.latestReportedAt)} placement="top">
                  <span className="text-sm text-muted-foreground cursor-help">
                    {formatDate(report.latestReportedAt)}
                  </span>
                </Tooltip>
              </ShadcnTableCell>
              <ShadcnTableCell>
                <Badge 
                  color={statusInfo.color}
                  variant="flat"
                  size="sm"
                >
                  {statusInfo.label}
                </Badge>
              </ShadcnTableCell>
              <ShadcnTableCell>
                <Tooltip content="View Report Details" placement="top">
                  <Button 
                    isIconOnly 
                    variant="light" 
                    size="sm"
                    onClick={() => onAction('reports', report)}
                    aria-label="View Report Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </Tooltip>
              </ShadcnTableCell>
            </ShadcnTableRow>
          );
        })}
      </ShadcnTableBody>
    </ShadcnTable>
  );
};

export default ReportedUsersTable;
