import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsQueryApi } from '../apis/reports/query/report.query.api';
import { reportsCommandApi } from '../apis/reports/command/report.command.api';
import { useReportStore } from '../stores/report.store';
import { QUERY_KEYS } from '../constants/query-keys.constant';

export const useFetchPendingReports = () => {
  const setPendingReports = useReportStore((s) => s.setPendingReports);

  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, QUERY_KEYS.PENDING],
    queryFn: () => reportsQueryApi.getReportByStatus('0'),
    onSuccess: setPendingReports,
  });
};

export const useFetchApprovedReports = () => {
  const setApprovedReports = useReportStore((s) => s.setApprovedReports);

  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, QUERY_KEYS.APPROVED],
    queryFn: () => reportsQueryApi.getReportByStatus('1,2'),
    onSuccess: setApprovedReports,
  });
};

export const useCreateReport = () => {
  const addPendingReport = useReportStore((s) => s.addPendingReport);

  return useMutation({
    mutationFn: ({ endpoint, reportedId, reason }) =>
      reportsCommandApi.createReport(endpoint, reportedId, reason),
    onSuccess: (data) => {
      addPendingReport(data);
    },
  });
};

