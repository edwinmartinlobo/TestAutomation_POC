import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api.service';

// Dashboard hooks
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiService.getDashboardSummary(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useFailureTrends(days = 30) {
  return useQuery({
    queryKey: ['dashboard', 'trends', days],
    queryFn: () => apiService.getFailureTrends(days),
  });
}

export function useHealthMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'health'],
    queryFn: () => apiService.getHealthMetrics(),
  });
}

export function useFailureBreakdown(days = 30) {
  return useQuery({
    queryKey: ['dashboard', 'breakdown', days],
    queryFn: () => apiService.getFailureBreakdown(days),
  });
}

// Triage hooks
export function useTriageReports(params?: {
  category?: string;
  minConfidence?: number;
  reviewed?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['triage', 'reports', params],
    queryFn: () => apiService.getTriageReports(params),
  });
}

export function useTriageReport(id: string) {
  return useQuery({
    queryKey: ['triage', 'report', id],
    queryFn: () => apiService.getTriageReport(id),
    enabled: !!id,
  });
}

export function useTriageStatistics() {
  return useQuery({
    queryKey: ['triage', 'statistics'],
    queryFn: () => apiService.getTriageStatistics(),
  });
}

export function useMarkTriageReviewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reviewedBy }: { id: string; reviewedBy: string }) =>
      apiService.markTriageReviewed(id, reviewedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triage'] });
    },
  });
}

export function useProcessUnanalyzedFailures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (limit: number) => apiService.processUnanalyzedFailures(limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triage'] });
    },
  });
}

// Self-Healing hooks
export function useLocatorChanges(params?: {
  status?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['healing', 'changes', params],
    queryFn: () => apiService.getLocatorChanges(params),
  });
}

export function useLocatorChange(id: string) {
  return useQuery({
    queryKey: ['healing', 'change', id],
    queryFn: () => apiService.getLocatorChange(id),
    enabled: !!id,
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['healing', 'pending'],
    queryFn: () => apiService.getPendingApprovals(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useHealingStatistics() {
  return useQuery({
    queryKey: ['healing', 'statistics'],
    queryFn: () => apiService.getHealingStatistics(),
  });
}

export function useApproveLocatorChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.approveLocatorChange(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healing'] });
    },
  });
}

export function useRejectLocatorChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiService.rejectLocatorChange(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healing'] });
    },
  });
}

// Test Results hooks
export function useTestResults(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['results', params],
    queryFn: () => apiService.getTestResults(params),
  });
}

export function useTestResult(id: string) {
  return useQuery({
    queryKey: ['result', id],
    queryFn: () => apiService.getTestResult(id),
    enabled: !!id,
  });
}

// Test Runs hooks
export function useTestRuns(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['runs', params],
    queryFn: () => apiService.getTestRuns(params),
  });
}

export function useTestRun(id: string) {
  return useQuery({
    queryKey: ['run', id],
    queryFn: () => apiService.getTestRun(id),
    enabled: !!id,
  });
}

export function useRunTests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { suite: string; platform?: string }) =>
      apiService.runTests(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}
