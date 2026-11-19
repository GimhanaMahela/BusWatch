"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFleetReport,
  getFleetReports,
  getFleetSummary,
  markLostItemFound,
  respondToReport,
} from "@/api/operatorApi";
import type { FleetReportParams } from "@/types/operator";

export const operatorKeys = {
  all: ["operator"] as const,
  summary: ["operator", "summary"] as const,
  list: (params: FleetReportParams) => ["operator", "reports", params] as const,
  report: (id: string) => ["operator", "report", id] as const,
};

export const useFleetSummary = () =>
  useQuery({ queryKey: operatorKeys.summary, queryFn: getFleetSummary });

export const useFleetReports = (params: FleetReportParams) =>
  useQuery({
    queryKey: operatorKeys.list(params),
    queryFn: () => getFleetReports(params),
    placeholderData: keepPreviousData,
  });

export const useFleetReport = (id: string) =>
  useQuery({ queryKey: operatorKeys.report(id), queryFn: () => getFleetReport(id) });

export const useRespondToReport = (id: string, found = false) => {
  const queryClient = useQueryClient();
  return useMutation({
    // Lost items: "We found it" also closes the report and tells the passenger where to collect it
    mutationFn: (body: string) => (found ? markLostItemFound(id, body) : respondToReport(id, body)),
    onSuccess: (report) => {
      queryClient.setQueryData(operatorKeys.report(id), report);
      void queryClient.invalidateQueries({ queryKey: operatorKeys.all, refetchType: "none" });
      void queryClient.invalidateQueries({ queryKey: operatorKeys.summary });
    },
  });
};
