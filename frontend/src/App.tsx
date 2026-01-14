import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import TestResults from './pages/TestResults';
import TriageReports from './pages/TriageReports';
import SelfHealing from './pages/SelfHealing';
import TestExecution from './pages/TestExecution';

function App() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="test-results" element={<TestResults />} />
          <Route path="triage" element={<TriageReports />} />
          <Route path="self-healing" element={<SelfHealing />} />
          <Route path="execution" element={<TestExecution />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
