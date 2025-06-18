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
          {/* <TableColumn className="text-md">No.</TableColumn>
                    <TableColumn className="text-md">Username</TableColumn>
                    <TableColumn className="text-md">Email</TableColumn>
                    <TableColumn className="text-md">Report Aproval Count</TableColumn>
                    <TableColumn className="text-md">Actions</TableColumn> */}
        </TableHeader>
        <TableBody>
          {[...Array(10)].map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-6 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 rounded-lg" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
