'use client';
import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import Image from 'next/image';
import Avatar from '@/public/images/testAvt.jpg';
import filterLightIcon from '@/public/images/filter_lightmode.png';
import filterDarkIcon from '@/public/images/filter_darkmode.png';
import { useTheme } from 'next-themes';
import Error from 'next/error';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
} from '@heroui/react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';
import TableLoading from '../../_components/table-loading';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { userQueryApi } from '@/src/apis/user/query/user.query.api';

const UserManagement = () => {
  // const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: userQueryApi.getAllUsers,
  });

  // useEffect(() => {
  //   if (users) {
  //     setFilteredUsers(users);
  //   }
  // }, [users]);

  // useEffect(() => {
  //   setFilteredUsers(
  //     users.filter((user) => user.username?.toLowerCase().includes(search.toLowerCase()))
  //   );
  // }, [search, users]);
const filteredUsers = useMemo(() => {
  return users.filter((user) =>
    user.username?.toLowerCase().includes(search.toLowerCase())
  );
}, [search, users]);

  return (
    <div className="h-screen w-[78rem] px-6 py-10">
      <div className="mx-auto mb-3 flex max-w-7xl items-center justify-between">
        <div className="w-1/2 pl-4">
          <h1 className="text-4xl font-bold">User List</h1>
          <p className="text-gray-500">
            Manage all reports about users who violated UNIFY&apos;s policies.
          </p>
        </div>
        <div className="flex w-1/2 items-center">
          <Input
            className="w-full"
            placeholder="Enter email"
            startContent={<i className="fa-solid fa-magnifying-glass"></i>}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
          />
        </div>
      </div>

      <div className="no-scrollbar h-[calc(73vh-0.7px)] overflow-auto rounded-2xl shadow-md">
        {loading ? (
          <TableLoading
            tableHeaders={['No.', 'Username', 'Email', 'Report Approval Count', 'Actions']}
          />
        ) : (
          <Table className="rounded-lg" isStriped aria-label="User Table">
            <TableHeader>
              <TableColumn className="text-md">No.</TableColumn>
              <TableColumn className="text-md">Username</TableColumn>
              <TableColumn className="text-md">Email</TableColumn>
              <TableColumn className="text-md">Report Approval Count</TableColumn>
              <TableColumn className="text-md">Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => (
                <TableRow key={user.id + index} className="text-black">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.reportApprovalCount}</TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <i className="fa-solid fa-ellipsis-vertical rounded-full px-4 py-2 hover:cursor-pointer hover:bg-gray-200"></i>
                      </DropdownTrigger>
                      <DropdownMenu onAction={(key) => alert(key)}>
                        <DropdownItem key="view">
                          <i className="fa-solid fa-eye"></i> View Profile
                        </DropdownItem>
                        <DropdownItem key="temp" className="text-warning-500" color="warning">
                          <i className="fa-solid fa-eye-slash"></i> Temporarily Disable
                        </DropdownItem>
                        <DropdownItem key="perm" className="text-danger" color="danger">
                          <i className="fa-solid fa-user-slash"></i> Permanently Disable
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
export default UserManagement;
