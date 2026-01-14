import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Stack,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  usePendingApprovals,
  useApproveLocatorChange,
  useRejectLocatorChange,
  useHealingStatistics,
} from '../hooks/useTestData';

function LocatorChangeCard({ change, onApprove, onReject, isProcessing }: any) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 50) return 'warning';
    return 'error';
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6">
              Locator Change #{change.id.substring(0, 8)}
            </Typography>
            <Chip
              label={`${change.confidence}% confidence`}
              color={getConfidenceColor(change.confidence)}
              size="small"
              sx={{ mt: 1 }}
            />
            <Chip
              label={change.healingStrategy.replace(/_/g, ' ')}
              variant="outlined"
              size="small"
              sx={{ mt: 1, ml: 1 }}
            />
          </Box>
          <Box>
            <Chip
              icon={<WarningIcon />}
              label={change.status.replace(/_/g, ' ')}
              color="warning"
              size="small"
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Old Locator (Failed)
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: 'error.light',
                borderRadius: 1,
                fontFamily: 'monospace',
              }}
            >
              <Typography variant="body2">
                <strong>Type:</strong> {change.oldLocator.type}
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                <strong>Value:</strong> {change.oldLocator.value}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              New Locator (Suggested)
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: 'success.light',
                borderRadius: 1,
                fontFamily: 'monospace',
              }}
            >
              <Typography variant="body2">
                <strong>Type:</strong> {change.newLocator.type}
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                <strong>Value:</strong> {change.newLocator.value}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {change.metadata && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Details
            </Typography>
            <Typography variant="body2">
              Created: {new Date(change.createdAt).toLocaleString()}
            </Typography>
          </Box>
        )}

        <Stack direction="row" spacing={2} mt={3}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => onApprove(change.id)}
            disabled={isProcessing}
          >
            Approve & Apply
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => onReject(change.id)}
            disabled={isProcessing}
          >
            Reject
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function SelfHealing() {
  const { data: pendingData, isLoading, error } = usePendingApprovals();
  const { data: statsData } = useHealingStatistics();
  const approveMutation = useApproveLocatorChange();
  const rejectMutation = useRejectLocatorChange();

  const handleApprove = async (id: string) => {
    await approveMutation.mutateAsync(id);
  };

  const handleReject = async (id: string) => {
    await rejectMutation.mutateAsync({ id });
  };

  const isProcessing = approveMutation.isPending || rejectMutation.isPending;
  const pendingChanges = pendingData?.data || [];
  const stats = statsData?.data;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Self-Healing
      </Typography>

      {/* Statistics */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Changes
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Auto-Applied
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.autoApplied}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Review
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Success Rate
                </Typography>
                <Typography variant="h4">{stats.successRate.toFixed(0)}%</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Typography variant="h5" gutterBottom>
        Pending Approvals
      </Typography>

      {isLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error">
          Failed to load pending approvals. Please check your backend connection.
        </Alert>
      )}

      {!isLoading && !error && pendingChanges.length === 0 && (
        <Alert severity="info">
          No pending approvals. All locator changes have been reviewed!
        </Alert>
      )}

      {!isLoading &&
        !error &&
        pendingChanges.map((change: any) => (
          <LocatorChangeCard
            key={change.id}
            change={change}
            onApprove={handleApprove}
            onReject={handleReject}
            isProcessing={isProcessing}
          />
        ))}
    </Box>
  );
}
