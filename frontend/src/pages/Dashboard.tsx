import { Typography, Grid, Card, CardContent, Box, CircularProgress, Alert } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  BugReport as BugReportIcon,
  Healing as HealingIcon,
} from '@mui/icons-material';
import { useDashboardSummary } from '../hooks/useTestData';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h3">{value}</Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: 2,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load dashboard data. Please check your backend connection.
      </Alert>
    );
  }

  const summary = data?.data;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Test Runs Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="Total Test Runs"
            value={summary?.testRuns?.total || 0}
            icon={<CheckCircleIcon sx={{ fontSize: 40, color: '#1976d2' }} />}
            color="#1976d2"
            subtitle={`${summary?.testRuns?.completed || 0} completed`}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="Pass Rate"
            value={`${summary?.testRuns?.passRate || 0}%`}
            icon={<CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />}
            color="#4caf50"
            subtitle={`${summary?.testRuns?.passed || 0}/${summary?.testRuns?.totalTests || 0} passed`}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="AI Triaged"
            value={summary?.triage?.total || 0}
            icon={<BugReportIcon sx={{ fontSize: 40, color: '#ff9800' }} />}
            color="#ff9800"
            subtitle={`${summary?.triage?.unreviewed || 0} pending review`}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="Self-Healed"
            value={summary?.healing?.autoApplied || 0}
            icon={<HealingIcon sx={{ fontSize: 40, color: '#9c27b0' }} />}
            color="#9c27b0"
            subtitle={`${summary?.healing?.successRate?.toFixed(0) || 0}% success rate`}
          />
        </Grid>

        {/* Test Results Breakdown */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Results (Last 30 Days)
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="textSecondary">Passed</Typography>
                  <Typography color="success.main" fontWeight="bold">
                    {summary?.testRuns?.passed || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="textSecondary">Failed</Typography>
                  <Typography color="error.main" fontWeight="bold">
                    {summary?.testRuns?.failed || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="textSecondary">Skipped</Typography>
                  <Typography color="warning.main" fontWeight="bold">
                    {summary?.testRuns?.skipped || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Triage Categories */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Failure Categories
              </Typography>
              <Box sx={{ mt: 2 }}>
                {summary?.triage?.byCategory &&
                  Object.entries(summary.triage.byCategory).map(([category, count]) => (
                    <Box key={category} display="flex" justifyContent="space-between" mb={1}>
                      <Typography color="textSecondary" sx={{ textTransform: 'capitalize' }}>
                        {category.replace(/_/g, ' ')}
                      </Typography>
                      <Typography fontWeight="bold">{count as number}</Typography>
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Healing Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Self-Healing Status
              </Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {summary?.healing?.total || 0}
                    </Typography>
                    <Typography color="textSecondary">Total Changes</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {summary?.healing?.autoApplied || 0}
                    </Typography>
                    <Typography color="textSecondary">Auto-Applied</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main">
                      {summary?.healing?.manuallyApproved || 0}
                    </Typography>
                    <Typography color="textSecondary">Manually Approved</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {summary?.healing?.pending || 0}
                    </Typography>
                    <Typography color="textSecondary">Pending Review</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
