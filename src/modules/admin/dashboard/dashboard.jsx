'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Select, SelectItem, Chip } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, BarChart } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryApi } from '@/src/apis/dashboard';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Eye,
  Calendar,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Activity,
  BarChart3
} from 'lucide-react';

const AdminDashboard = () => {
  const router = useRouter();
  const [chartPeriod, setChartPeriod] = useState('7days');
  const [chartType, setChartType] = useState('area');

  // Fetch dashboard statistics from API
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardQueryApi.getStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch analytics data from API
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['dashboard-analytics', chartPeriod],
    queryFn: () => dashboardQueryApi.getAnalytics(chartPeriod),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get chart data from API response
  const currentData = analyticsData?.data || [];
  const dataKey = chartPeriod === '12months' ? 'month' : 'day';

  // Mock data for pending reports
  const mockPendingReports = [
    {
      reportedId: '1',
      latestReportedAt: '2024-01-15T10:30:00Z',
      reportCount: 3,
      type: 'post',
      severity: 'high'
    },
    {
      reportedId: '2',
      latestReportedAt: '2024-01-14T15:45:00Z',
      reportCount: 5,
      type: 'post',
      severity: 'medium'
    },
    {
      reportedId: '3',
      latestReportedAt: '2024-01-14T09:20:00Z',
      reportCount: 2,
      type: 'user',
      severity: 'low'
    },
    {
      reportedId: '4',
      latestReportedAt: '2024-01-13T16:10:00Z',
      reportCount: 7,
      type: 'post',
      severity: 'high'
    },
    {
      reportedId: '5',
      latestReportedAt: '2024-01-13T11:35:00Z',
      reportCount: 1,
      type: 'user',
      severity: 'medium'
    }
  ];

  // Separate data for reported posts and users
  const reportedPosts = mockPendingReports.filter(report => report.type === 'post');
  const reportedUsers = mockPendingReports.filter(report => report.type === 'user');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityText = (severity) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };



  // Handle loading and error states
  if (statsLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError || analyticsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-2">Failed to load dashboard data</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {statsError?.message || analyticsError?.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome to the Unify Admin Panel</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
          <Button
            size="sm"
            variant="flat"
            startContent={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardBody className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/20">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalUsers?.toLocaleString() || 0}</p>
              <p className="text-xs text-green-600 dark:text-green-400">+{stats?.userGrowthPercent?.toFixed(1) || 0}% from last month</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardBody className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/20">
              <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalPosts?.toLocaleString() || 0}</p>
              <p className="text-xs text-green-600 dark:text-green-400">+{stats?.postGrowthPercent?.toFixed(1) || 0}% from last month</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardBody className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-orange-100 p-4 dark:bg-orange-900/20">
              <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Reports</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalPendingReports || 0}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">{stats?.newReportsToday || 0} new today</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardBody className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-purple-100 p-4 dark:bg-purple-900/20">
              <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.activeUsers?.toLocaleString() || 0}</p>
              <p className="text-xs text-green-600 dark:text-green-400">+{stats?.activeUserGrowthPercent?.toFixed(1) || 0}% from last month</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts and Tables Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card className="shadow-lg">
          <CardHeader className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">User Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">User growth and activity trends</p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                size="sm"
                variant="bordered"
                selectedKeys={[chartPeriod]}
                onSelectionChange={(keys) => setChartPeriod(Array.from(keys)[0])}
                className="w-32"
              >
                <SelectItem key="7days" value="7days">7 Days</SelectItem>
                <SelectItem key="30days" value="30days">30 Days</SelectItem>
                <SelectItem key="12months" value="12months">12 Months</SelectItem>
              </Select>
              <Select
                size="sm"
                variant="bordered"
                selectedKeys={[chartType]}
                onSelectionChange={(keys) => setChartType(Array.from(keys)[0])}
                className="w-24"
              >
                <SelectItem key="area" value="area">
                  <div className="flex items-center gap-2">
                    <Area className="h-3 w-3" />
                    <span>Area</span>
                  </div>
                </SelectItem>
                <SelectItem key="bar" value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3 w-3" />
                    <span>Bar</span>
                  </div>
                </SelectItem>
              </Select>
              <Button
                size="sm"
                variant="light"
                startContent={<Download className="h-4 w-4" />}
              >
                Export
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading chart data...</p>
                </div>
              </div>
            ) : currentData.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No data available for this period</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                {chartType === 'area' ? (
                  <AreaChart data={currentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey={dataKey} 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--nextui-colors-background)',
                        border: '1px solid var(--nextui-colors-border)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="newUsers" 
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6}
                      name="New Users"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stackId="2"
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                      name="Active Users"
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={currentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey={dataKey} 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--nextui-colors-background)',
                        border: '1px solid var(--nextui-colors-border)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="newUsers" fill="#3b82f6" name="New Users" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="activeUsers" fill="#10b981" name="Active Users" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Reported Posts Table */}
        <Card className="shadow-lg">
          <CardHeader className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reported Posts</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Latest post reports requiring attention</p>
            </div>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={() => router.push('/manage/posts/reports')}
            >
              View All
            </Button>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {reportedPosts.map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                      <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Post Report
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(report.latestReportedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Chip
                      size="sm"
                      color={getSeverityColor(report.severity)}
                      variant="flat"
                    >
                      {getSeverityText(report.severity)}
                    </Chip>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {report.reportCount} reports
                    </span>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => router.push(`/manage/posts/reports/${report.reportedId}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {reportedPosts.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No reported posts</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Reported Users Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Reported Users Table */}
        <Card className="shadow-lg">
          <CardHeader className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reported Users</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Latest user reports requiring attention</p>
            </div>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={() => router.push('/manage/users/reports')}
            >
              View All
            </Button>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {reportedUsers.map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                      <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        User Report
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(report.latestReportedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Chip
                      size="sm"
                      color={getSeverityColor(report.severity)}
                      variant="flat"
                    >
                      {getSeverityText(report.severity)}
                    </Chip>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {report.reportCount} reports
                    </span>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => router.push(`/manage/users/reports/${report.reportedId}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {reportedUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No reported users</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Additional Analytics or Summary Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4 inline-block">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reports Summary</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overview of all pending reports</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/20">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Reported Posts</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Requiring attention</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{reportedPosts.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">posts</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/20">
                    <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Reported Users</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Requiring attention</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{reportedUsers.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">users</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Total Reports</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">All pending reports</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalPendingReports || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">total</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg">
        <CardHeader className='inline-block'>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Common admin tasks and shortcuts</p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="bordered"
              className="h-24 flex-col gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
              onPress={() => router.push('/manage/users/list')}
            >
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium">Manage Users</span>
            </Button>
            <Button
              variant="bordered"
              className="h-24 flex-col gap-3 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors"
              onPress={() => router.push('/manage/posts/list')}
            >
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium">Manage Posts</span>
            </Button>
            <Button
              variant="bordered"
              className="h-24 flex-col gap-3 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
              onPress={() => router.push('/manage/posts/reports')}
            >
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/20">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium">Review Reports</span>
            </Button>
            <Button
              variant="bordered"
              className="h-24 flex-col gap-3 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
              onPress={() => router.push('/statistics/users')}
            >
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium">View Statistics</span>
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminDashboard;
