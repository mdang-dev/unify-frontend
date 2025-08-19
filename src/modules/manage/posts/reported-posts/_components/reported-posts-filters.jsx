'use client';
import React, { useState } from 'react';
import { Button, Input, Select, SelectItem } from '@heroui/react';

const ReportedPostsFilters = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: '',
      reportedAtFrom: '',
      reportedAtTo: '',
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Status</label>
          <Select
            placeholder="All Statuses"
            selectedKeys={localFilters.status ? [localFilters.status.toString()] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] || '';
              handleFilterChange('status', value);
            }}
            className="w-full"
          >
            <SelectItem key="">All Statuses</SelectItem>
            <SelectItem key="0">Pending</SelectItem>
            <SelectItem key="1">Approved</SelectItem>
            <SelectItem key="2">Rejected</SelectItem>
            <SelectItem key="3">Resolved</SelectItem>
            <SelectItem key="4">Canceled</SelectItem>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Reported From</label>
          <Input
            type="datetime-local"
            value={localFilters.reportedAtFrom}
            onChange={(e) => handleFilterChange('reportedAtFrom', e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Reported To</label>
          <Input
            type="datetime-local"
            value={localFilters.reportedAtTo}
            onChange={(e) => handleFilterChange('reportedAtTo', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex items-end gap-2">
          <Button
            color="primary"
            onClick={handleApplyFilters}
            className="flex-1"
          >
            Apply Filters
          </Button>
          <Button
            variant="bordered"
            onClick={handleClearFilters}
            className="flex-1"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportedPostsFilters;
