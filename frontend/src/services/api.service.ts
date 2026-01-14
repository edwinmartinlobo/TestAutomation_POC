import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError) {
    if (error.response) {
      const message = (error.response.data as any)?.error?.message || 'An error occurred';
      toast.error(message);
    } else if (error.request) {
      toast.error('No response from server. Please check your connection.');
    } else {
      toast.error('Request failed. Please try again.');
    }
  }

  // Dashboard API
  async getDashboardSummary() {
    const response = await this.client.get('/dashboard/summary');
    return response.data;
  }

  async getFailureTrends(days = 30) {
    const response = await this.client.get('/dashboard/trends', { params: { days } });
    return response.data;
  }

  async getHealthMetrics() {
    const response = await this.client.get('/dashboard/health');
    return response.data;
  }

  async getFailureBreakdown(days = 30) {
    const response = await this.client.get('/dashboard/failure-breakdown', {
      params: { days },
    });
    return response.data;
  }

  // Triage API
  async getTriageReports(params?: {
    category?: string;
    minConfidence?: number;
    reviewed?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.client.get('/triage/reports', { params });
    return response.data;
  }

  async getTriageReport(id: string) {
    const response = await this.client.get(`/triage/reports/${id}`);
    return response.data;
  }

  async analyzeFailure(failureId: string) {
    const response = await this.client.post(`/triage/analyze/${failureId}`);
    return response.data;
  }

  async markTriageReviewed(id: string, reviewedBy: string) {
    const response = await this.client.put(`/triage/reports/${id}/review`, {
      reviewedBy,
    });
    return response.data;
  }

  async getTriageStatistics() {
    const response = await this.client.get('/triage/statistics');
    return response.data;
  }

  async processUnanalyzedFailures(limit = 10) {
    const response = await this.client.post('/triage/process-unanalyzed', null, {
      params: { limit },
    });
    return response.data;
  }

  // Self-Healing API
  async getLocatorChanges(params?: {
    status?: string;
    minConfidence?: number;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.client.get('/healing/changes', { params });
    return response.data;
  }

  async getLocatorChange(id: string) {
    const response = await this.client.get(`/healing/changes/${id}`);
    return response.data;
  }

  async getPendingApprovals() {
    const response = await this.client.get('/healing/pending');
    return response.data;
  }

  async approveLocatorChange(id: string) {
    const response = await this.client.post(`/healing/changes/${id}/approve`);
    toast.success('Locator change approved successfully');
    return response.data;
  }

  async rejectLocatorChange(id: string, reason?: string) {
    const response = await this.client.post(`/healing/changes/${id}/reject`, {
      reason,
    });
    toast.success('Locator change rejected');
    return response.data;
  }

  async getHealingStatistics() {
    const response = await this.client.get('/healing/statistics');
    return response.data;
  }

  async triggerHealing(data: {
    page: string;
    element: string;
    failedLocator: { type: string; value: string };
    fallbackLocators?: Array<{ type: string; value: string }>;
    error: string;
    screenshot?: string;
    failureId?: string;
  }) {
    const response = await this.client.post('/healing/trigger', data);
    return response.data;
  }

  // Test Results API
  async getTestResults(params?: { limit?: number; offset?: number }) {
    const response = await this.client.get('/results', { params });
    return response.data;
  }

  async getTestResult(id: string) {
    const response = await this.client.get(`/results/${id}`);
    return response.data;
  }

  // Test Runs API
  async getTestRuns(params?: { limit?: number; offset?: number }) {
    const response = await this.client.get('/tests/runs', { params });
    return response.data;
  }

  async getTestRun(id: string) {
    const response = await this.client.get(`/tests/runs/${id}`);
    return response.data;
  }

  async runTests(data: { suite: string; platform?: string }) {
    const response = await this.client.post('/tests/run', data);
    toast.success('Test execution started');
    return response.data;
  }
}

export const apiService = new ApiService();
