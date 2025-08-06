'use client';

import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

export default function TableLoading({ tableHeaders = [''] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {tableHeaders.map((header, index) => (
            <TableColumn key={index} className="text-md">
              {header}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {[...Array(10)].map((_, index) => (
            <TableRow key={index}>
              {tableHeaders.map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-6 rounded-lg" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
