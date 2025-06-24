'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import ReportCard from './_components/report-card';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { reportsQueryApi } from '@/src/apis/reports/query/report.query.api';

export default function Support() {
  
  const { username } = useParams();

  const { data: sentReports = [] } = useQuery({
    queryKey: [QUERY_KEYS.REPORTS_BY_SENT],
    queryFn: () => reportsQueryApi.fetchReportsOnMyPosts(username),
    enabled: !!username,
  });

  const { data: receivedReports = [] } = useQuery({
    queryKey: [QUERY_KEYS.REPORTS_BY_RECEIVED],
    queryFn: () => reportsQueryApi.fetchMyReportedEntities(username),
    enabled: !!username,
  });

  return (
    <div className="container mx-auto h-screen overflow-y-auto px-4 py-6 scrollbar-hide">
      <h1 className="mb-6 text-2xl font-bold">Report Management</h1>

      <Tabs defaultValue="sent" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sent">Reports I&apos;ve Sent</TabsTrigger>
          <TabsTrigger value="received">Reports Against My Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="space-y-4">
          {sentReports.length > 0 ? (
            sentReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                type="sent"
                sentReports={sentReports}
                receivedReports={receivedReports}
              />
            ))
          ) : (
            <div className="py-8 text-center text-gray-500">No reports sent yet</div>
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {receivedReports.length > 0 ? (
            receivedReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                type="received"
                sentReports={sentReports}
                receivedReports={receivedReports}
              />
            ))
          ) : (
            <div className="py-8 text-center text-gray-500">No reports received yet</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
