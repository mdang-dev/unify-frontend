'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Tabs, Tab, Card, CardBody } from '@heroui/react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const UserStatistics = () => {
  const { theme, setTheme } = useTheme();

  const series = [
    {
      name: 'New Users',
      data: [10, 41, 35, 51, 49, 62, 69, 91, 148, 75, 175, 61],
    },
    {
      name: 'Returning Users',
      data: [5, 25, 15, 30, 24, 35, 50, 70, 90, 74, 93, 28],
    },
  ];

  const options = {
    chart: {
      type: 'line',
      toolbar: { show: true },
      zoom: { enabled: true },
      foreColor: theme === 'dark' ? '#fff' : '#000',
    },
    xaxis: {
      categories: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      labels: {
        style: {
          colors: theme === 'dark' ? '#fff' : '#000',
          fontSize: '13px',
        },
      },
      title: {
        text: 'Months',
        style: { color: `${theme === 'dark' ? '#fff' : '#000'}` },
      },
    },
    yaxis: {
      title: {
        text: 'Users',
        style: { color: `${theme === 'dark' ? '#fff' : '#000'}` },
      },
      labels: {
        style: {
          colors: `${theme === 'dark' ? '#fff' : '#000'}`,
          fontSize: '12px',
        },
      },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    colors: ['#1E90FF', '#FF5733'],
    tooltip: {
      theme: 'dark',
    },
    legend: {
      position: 'top',
      labels: {
        colors: theme === 'dark' ? '#fff' : '#000',
        useSeriesColors: false,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto mb-3 max-w-7xl">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">User Statistics</h1>
      </div>

      <div className="flex w-full flex-col">
        <Tabs aria-label="Options" color="primary" variant="bordered">
          <Tab
            key="table"
            title={
              <div className="flex items-center space-x-2">
                <span>Table</span>
              </div>
            }
          >
            <div className="mx-auto max-w-7xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
              <h2 className="mb-5 text-xl font-semibold text-gray-600 dark:text-white">
                Recent Users
              </h2>
              <table className="min-w-full table-auto border-collapse rounded-none">
                <thead>
                  <tr className="text-left dark:bg-slate-600">
                    <th className="px-5 py-3 text-sm font-semibold text-gray-600 dark:text-white">
                      Name
                    </th>
                    <th className="px-5 py-3 text-sm font-semibold text-gray-600 dark:text-white">
                      Email
                    </th>
                    <th className="px-5 py-3 text-sm font-semibold text-gray-600 dark:text-white">
                      Date Registered
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: 'John Doe',
                      email: 'johndoe@example.com',
                      date: '2025-01-18',
                    },
                    {
                      name: 'Jane Smith',
                      email: 'janesmith@example.com',
                      date: '2025-01-17',
                    },
                    {
                      name: 'Sam Wilson',
                      email: 'samwilson@example.com',
                      date: '2025-01-15',
                    },
                  ].map((user, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      } transition-colors hover:bg-gray-100`}
                    >
                      <td className="px-5 py-3 text-sm text-gray-700">{user.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{user.email}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{user.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tab>
          <Tab
            key="chart"
            title={
              <div className="flex items-center space-x-2">
                <span>Chart</span>
              </div>
            }
          >
            <Card>
              <CardBody>
                <div className="mx-auto mb-10 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-lg dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-600 dark:text-white">
                      Total Users
                    </h2>
                    <p className="mt-3 text-3xl font-bold text-blue-500">1,245</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                      All registered users
                    </p>
                  </div>
                  <div className="rounded-lg border-l-4 border-green-500 bg-white p-6 shadow-lg dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-600 dark:text-white">
                      New Users This Month
                    </h2>
                    <p className="mt-3 text-3xl font-bold text-green-500">128</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                      Compared to last month
                    </p>
                  </div>
                  <div className="rounded-lg border-l-4 border-yellow-500 bg-white p-6 shadow-lg dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-600 dark:text-white">
                      Active Users
                    </h2>
                    <p className="mt-3 text-3xl font-bold text-yellow-500">765</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                      Users with recent activity
                    </p>
                  </div>
                </div>

                <div className="mx-auto mb-10 w-full rounded-lg bg-white p-6 text-white shadow-lg dark:bg-gray-700">
                  <h2 className="mb-5 text-xl font-semibold text-gray-600 dark:text-white">
                    User Growth
                  </h2>
                  <Chart
                    options={options}
                    series={series}
                    type="line"
                    height={350}
                    className="text-black dark:text-white"
                  />
                </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default UserStatistics;
