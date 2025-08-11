'use client';
import React from 'react';
import {
  Button,
  Select,
  SelectItem,
  Input,
} from '@heroui/react';

const ReportedUsersFilters = ({ 
  localFilters, 
  onFilterChange, 
  onApplyFilters, 
  onClearFilters, 
  hasActiveFilters 
}) => {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">Filter Criteria</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            placeholder="Select status"
            selectedKeys={localFilters.status !== '' && localFilters.status !== undefined && localFilters.status !== null ? [String(localFilters.status)] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] ?? '';
              onFilterChange('status', value);
            }}
            className="w-full"
          >
            <SelectItem key="0">Pending</SelectItem>
            <SelectItem key="1">Approved</SelectItem>
            <SelectItem key="2">Rejected</SelectItem>
          </Select>
        </div>

        {/* Reported At From Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Reported From</label>
          <Input
            type="datetime-local"
            placeholder="Select start date"
            value={localFilters.reportedAtFrom ? localFilters.reportedAtFrom.slice(0, 16) : ''}
            onChange={(e) => {
              const value = e.target.value ? new Date(e.target.value).toISOString() : null;
              onFilterChange('reportedAtFrom', value);
            }}
            className="w-full"
          />
        </div>

        {/* Reported At To Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Reported To</label>
          <Input
            type="datetime-local"
            placeholder="Select end date"
            value={localFilters.reportedAtTo ? localFilters.reportedAtTo.slice(0, 16) : ''}
            onChange={(e) => {
              const value = e.target.value ? new Date(e.target.value).toISOString() : null;
              onFilterChange('reportedAtTo', value);
            }}
            className="w-full"
          />
        </div>
      </div>

      {/* Filter Actions */}
      <div className="mt-6 flex gap-3">
        <Button
          color="primary"
          onClick={onApplyFilters}
          className="px-6"
          disabled={!hasActiveFilters}
        >
          Apply Filters
        </Button>
        <Button
          variant="bordered"
          onClick={onClearFilters}
          className="px-6"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default ReportedUsersFilters;
