-- Initial database schema for AI Test Automation Framework

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Test Cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('mobile', 'api')),
    platform VARCHAR(50) CHECK (platform IN ('ios', 'android', 'web', NULL)),
    suite VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    tags TEXT[],
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Test Runs table
CREATE TABLE IF NOT EXISTS test_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    environment VARCHAR(100) NOT NULL,
    platform VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    total_tests INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    triggered_by VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Test Results table
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES test_cases(id) ON DELETE SET NULL,
    test_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('passed', 'failed', 'skipped')),
    duration_ms INTEGER,
    error_message TEXT,
    stack_trace TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    retry_count INTEGER DEFAULT 0,
    healed BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Failures table
CREATE TABLE IF NOT EXISTS failures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_result_id UUID NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
    failure_type VARCHAR(100) CHECK (failure_type IN (
        'locator_not_found',
        'assertion_failed',
        'timeout',
        'crash',
        'network_error',
        'unknown'
    )),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    locator_used TEXT,
    log_snippet TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    analyzed BOOLEAN DEFAULT false
);

-- Screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
    failure_id UUID REFERENCES failures(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50) CHECK (type IN ('failure', 'step', 'comparison')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triage Reports table
CREATE TABLE IF NOT EXISTS triage_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    failure_id UUID NOT NULL REFERENCES failures(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'actual_bug',
        'flaky_locator',
        'timing_issue',
        'environmental_issue',
        'test_data_issue'
    )),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    summary TEXT,
    ai_analysis JSONB NOT NULL, -- {reasoning, evidencePoints, suggestedActions}
    bug_probability INTEGER CHECK (bug_probability >= 0 AND bug_probability <= 100),
    root_cause TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Locator Changes table (Self-Healing)
CREATE TABLE IF NOT EXISTS locator_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    failure_id UUID REFERENCES failures(id) ON DELETE SET NULL,
    old_locator JSONB NOT NULL, -- {type, value}
    new_locator JSONB NOT NULL, -- {type, value}
    healing_strategy VARCHAR(100) NOT NULL CHECK (healing_strategy IN (
        'ai_suggested',
        'similarity_match',
        'fallback_chain'
    )),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval' CHECK (status IN (
        'pending_approval',
        'approved',
        'rejected',
        'auto_applied'
    )),
    applied_at TIMESTAMP WITH TIME ZONE,
    success BOOLEAN,
    metadata JSONB, -- {elementAttributes, contextInfo}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Test Logs table
CREATE TABLE IF NOT EXISTS test_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_result_id UUID NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
    log_level VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_test_results_run_id ON test_results(test_run_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_failures_result_id ON failures(test_result_id);
CREATE INDEX IF NOT EXISTS idx_failures_type ON failures(failure_type);
CREATE INDEX IF NOT EXISTS idx_failures_analyzed ON failures(analyzed);

CREATE INDEX IF NOT EXISTS idx_screenshots_result_id ON screenshots(test_result_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_failure_id ON screenshots(failure_id);

CREATE INDEX IF NOT EXISTS idx_triage_reports_failure_id ON triage_reports(failure_id);
CREATE INDEX IF NOT EXISTS idx_triage_reports_category ON triage_reports(category);
CREATE INDEX IF NOT EXISTS idx_triage_reports_created_at ON triage_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_locator_changes_test_case_id ON locator_changes(test_case_id);
CREATE INDEX IF NOT EXISTS idx_locator_changes_status ON locator_changes(status);
CREATE INDEX IF NOT EXISTS idx_locator_changes_created_at ON locator_changes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);
CREATE INDEX IF NOT EXISTS idx_test_runs_created_at ON test_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_logs_result_id ON test_logs(test_result_id);
CREATE INDEX IF NOT EXISTS idx_test_logs_timestamp ON test_logs(timestamp DESC);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update_updated_at trigger to relevant tables
CREATE TRIGGER update_test_cases_updated_at BEFORE UPDATE ON test_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_triage_reports_updated_at BEFORE UPDATE ON triage_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locator_changes_updated_at BEFORE UPDATE ON locator_changes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- This can be moved to seeds if preferred
COMMENT ON TABLE test_cases IS 'Stores test case definitions';
COMMENT ON TABLE test_runs IS 'Tracks test execution runs';
COMMENT ON TABLE test_results IS 'Individual test results within a run';
COMMENT ON TABLE failures IS 'Detailed failure information';
COMMENT ON TABLE screenshots IS 'Screenshots captured during tests';
COMMENT ON TABLE triage_reports IS 'AI-generated failure analysis reports';
COMMENT ON TABLE locator_changes IS 'Self-healing locator modifications';
COMMENT ON TABLE test_logs IS 'Test execution logs';
