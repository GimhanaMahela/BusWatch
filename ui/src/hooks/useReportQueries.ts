"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdmins, createAdmin } from "@/api/authApi";
import {
  addReportNote,
  deleteReport,
  getAllReports,
  getReportById,
  getReportStats,
  rateOutcome,
  setReportVisibility,
  trackReport,
  updateReportStatus,
} from "@/api/reportApi";
import type { ReportStatus } from "@/constants/reportConstants";
import { createStory, deleteStory, listStories, updateStory } from "@/api/storyApi";
import type { AdminRole } from "@/types/admin";
import type { StoryInput } from "@/types/public";
import type { Report, ReportListParams } from "@/types/report";

/** Query keys in one place so mutations can invalidate the right caches */
export const queryKeys = {
  reports: ["reports"] as const,
  reportList: (params: ReportListParams) => ["reports", "list", params] as const,
  report: (id: string) => ["reports", "detail", id] as const,
  stats: ["reports", "stats"] as const,
  tracking: (receiptId: string) => ["tracking", receiptId.trim().toUpperCase()] as const,
  admins: ["admins"] as const,
  stories: ["stories"] as const,
};

export const useReportList = (params: ReportListParams) =>
  useQuery({
    queryKey: queryKeys.reportList(params),
    queryFn: () => getAllReports(params),
    placeholderData: keepPreviousData, // keep the table visible while paging/filtering
  });

export const useReport = (id: string) =>
  useQuery({ queryKey: queryKeys.report(id), queryFn: () => getReportById(id), enabled: !!id });

export const useReportStats = () =>
  useQuery({ queryKey: queryKeys.stats, queryFn: getReportStats });

export const useTrackedReport = (receiptId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.tracking(receiptId ?? ""),
    queryFn: () => trackReport(receiptId ?? ""),
    enabled: !!receiptId,
    retry: false, // a 404 means "no such receipt", not a transient failure
  });

/** Public: the passenger rates the outcome; the tracking page updates in place. */
export const useRateOutcome = (receiptId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { rating: number; feedback: string }) =>
      rateOutcome(receiptId, input.rating, input.feedback),
    onSuccess: (report) => queryClient.setQueryData(queryKeys.tracking(receiptId), report),
  });
};

export const useAdmins = (enabled: boolean) =>
  useQuery({ queryKey: queryKeys.admins, queryFn: listAdmins, enabled });

/** After a change to one report, refresh lists/stats and store the new version. */
const useReportUpdated = () => {
  const queryClient = useQueryClient();
  return (report: Report) => {
    queryClient.setQueryData(queryKeys.report(report.id), report);
    void queryClient.invalidateQueries({ queryKey: queryKeys.reports, refetchType: "none" });
  };
};

export const useUpdateReportStatus = (id: string) => {
  const onUpdated = useReportUpdated();
  return useMutation({
    mutationFn: (input: { status: ReportStatus; note: string; notifyPassenger: boolean }) =>
      updateReportStatus(id, input.status, input.note, input.notifyPassenger),
    onSuccess: onUpdated,
  });
};

export const useAddReportNote = (id: string) => {
  const onUpdated = useReportUpdated();
  return useMutation({
    mutationFn: (text: string) => addReportNote(id, text),
    onSuccess: onUpdated,
  });
};

export const useSetReportVisibility = (id: string) => {
  const onUpdated = useReportUpdated();
  return useMutation({
    mutationFn: (hiddenFromPublic: boolean) => setReportVisibility(id, hiddenFromPublic),
    onSuccess: onUpdated,
  });
};

// ---------------------------------------------------------------- Resolved case stories

export const useStories = () => useQuery({ queryKey: queryKeys.stories, queryFn: listStories });

/** Creates a story, or updates one when `id` is given. */
export const useSaveStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: Partial<StoryInput> }) =>
      id ? updateStory(id, input) : createStory(input as StoryInput),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.stories }),
  });
};

export const useDeleteStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.stories }),
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reports }),
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string; role: AdminRole }) =>
      createAdmin(input.email, input.password, input.role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.admins }),
  });
};
