'use client';
import React from 'react';
import NavButton from './nav-button';

const ToggleFilter = ({
  isFilterOpen,
  toggleTypeOrder,
  toggleReportDateOrder,
  isDescendingByType,
  isDescendingByReportDate,
}) => {
  if (!isFilterOpen) return null;

  return (
    <div className="w-90 absolute right-10 z-50 mt-[40px] rounded-md bg-gray-200 shadow-lg dark:bg-neutral-700 dark:text-white">
      <ul className="px-2 py-2">
        <div className="mb-2 rounded-lg px-2 hover:bg-gray-100 dark:hover:bg-neutral-600">
          <NavButton
            iconClass={`fa-solid ${
              isDescendingByType ? 'fa-arrow-down-a-z' : 'fa-arrow-up-a-z'
            } mr-3 my-3`}
            content={isDescendingByType ? 'Descending by Type' : 'Ascending by Type'}
            onClick={toggleTypeOrder}
          />
        </div>
        <div className="rounded-lg px-2 hover:bg-gray-100 dark:hover:bg-neutral-600">
          <NavButton
            iconClass={`fa-solid ${
              isDescendingByReportDate ? 'fa-arrow-down-wide-short' : 'fa-arrow-up-wide-short'
            } mr-3 my-3`}
            content={
              isDescendingByReportDate ? 'Descending by Report date' : 'Ascending by Report date'
            }
            onClick={toggleReportDateOrder}
          />
        </div>
      </ul>
    </div>
  );
};

export default ToggleFilter;
