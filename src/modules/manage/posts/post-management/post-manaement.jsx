'use client';
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';
import TableLoading from '../../_components/table-loading';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { reportsQueryApi } from '@/src/apis/reports/query/report.query.api';

export const STATUSES = [
  { key: 'pending', value: 'Pending' },
  { key: 'approved', value: 'Approved' },
  { key: 'rejected', value: 'Rejected' },
  { key: 'resolved', value: 'Resolved' },
  { key: 'canceled', value: 'Canceled' },
];

const PostManagement = () => {
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const router = useRouter();
  const [filterKey, setFilterKey] = useState('0');

  const { data: posts = [], isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.REPORTS_BY_KEY, filterKey],
    queryFn: () => reportsQueryApi.fetchFilteredReportedPosts(filterKey),
    enabled: !!filterKey,
    placeholderData: keepPreviousData,
  });

  const handleClick = (key, postId) => {
    switch (key) {
      case 'view':
        router.push('/manage/posts/' + postId);
        break;
      default:
        break;
    }
  };

  const handleSelectionChange = (val) => {
    const selected = Array.from(val)[0]; // val is a Set
    if (selected !== filterKey) {
      setFilterKey(selected);
    }
  };

  useEffect(() => {
    setFilteredPosts(
      posts.filter((post) => post?.user?.username?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, posts]);

  return (
    <div className="h-screen px-6 py-10">
      <div className="mx-auto mb-3 flex items-center justify-between pr-5">
        <div className="w-1/2 pl-4">
          <h1 className={`text-4xl font-black uppercase`}>Reported Posts</h1>
          <p className="text-gray-500">
            Manage all reports about posts that violated UNIFY&apos;s policies.
          </p>
        </div>
        <div className="flex w-1/2 items-center">
          <Input
            label=""
            className="w-full"
            labelPlacement="inside"
            placeholder="Enter Post ID or Hashtags"
            startContent={<i className="fa-solid fa-magnifying-glass"></i>}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
          />
          {/* <input
            type="text"
            className="bg-white border border-gray-500 text-black px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:bg-black dark:text-white"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          /> */}
        </div>
      </div>
      <div className="flex">
        <Select
          className="mb-2 ml-auto w-2/3 max-w-xs pr-5"
          label="Filter by status"
          placeholder="Select a status"
          onSelectionChange={handleSelectionChange}
          isRequired
          defaultSelectedKeys={[filterKey]}
        >
          <SelectItem
            key={'0'}
            startContent={<i className="fa-solid fa-hourglass-half"></i>}
            className="text-primary-500"
          >
            Pending
          </SelectItem>
          <SelectItem
            key={'1'}
            startContent={<i className="fa-solid fa-thumbs-up"></i>}
            className="text-success-500"
          >
            Approved
          </SelectItem>
          <SelectItem
            key={'2'}
            startContent={<i className="fa-solid fa-ban"></i>}
            className="text-red-500"
          >
            Rejected
          </SelectItem>
          <SelectItem
            key={'3'}
            startContent={<i className="fa-brands fa-resolving"></i>}
            className="text-warning-500"
          >
            Resolved
          </SelectItem>
          <SelectItem
            key={'4'}
            startContent={<i className="fa-solid fa-rectangle-xmark"></i>}
            className="text-zinc-500"
          >
            Canceled
          </SelectItem>
        </Select>
        {/* <Button className="mr-7 h-14 w-14 border text-xl"><i className="fa-solid fa-filter"></i></Button> */}
      </div>
      <div className="no-scrollbar h-[calc(73vh-0.7px)] overflow-auto">
        {loading ? (
          // <p className="text-center text-gray-500">Loading users...</p>
          <TableLoading tableHeaders={['No.', 'Reported At', 'Reason', 'Status', 'Actions']} />
        ) : (
          <Table className="h-[95%] rounded-lg" isStriped aria-label="">
            <TableHeader className="mb-0">
              <TableColumn>No.</TableColumn>
              <TableColumn>Reported At</TableColumn>
              <TableColumn>Reason</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {posts.map((post, index) => (
                <TableRow key={post.id} className="text-black">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {new Date(post.reportedAt).toLocaleString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>{post.reason}</TableCell>
                  <TableCell
                    className={clsx('my-0.5 font-bold', {
                      'text-primary-500': post?.status === 0,
                      'text-success-500': post?.status === 1,
                      'text-red-500': post?.status === 2,
                      'text-warning-500': post?.status === 3,
                      'text-zinc-500': post?.status === 4,
                    })}
                  >
                    {' '}
                    {post?.status === 0
                      ? 'Pending'
                      : post?.status === 1
                        ? 'Approved'
                        : post?.status === 2
                          ? 'Rejected'
                          : post?.status === 3
                            ? 'Resolved'
                            : 'Canceled'}
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <i className="fa-solid fa-ellipsis-vertical rounded-full px-4 py-2 hover:cursor-pointer hover:bg-gray-200"></i>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Action event example"
                        onAction={(key) => handleClick(key, post.id)}
                      >
                        <DropdownItem key="view">
                          <i className="fa-solid fa-eye"></i> View Details
                        </DropdownItem>
                        <DropdownItem key="temp" className="text-success-500" color="success">
                          <i className="fa-solid fa-thumbs-up"></i> Approve This Report
                        </DropdownItem>
                        <DropdownItem key="perm" className="text-danger" color="danger">
                          <i className="fa-solid fa-ban"></i> Reject This Report
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

export default PostManagement;
