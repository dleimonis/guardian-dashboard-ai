-- Guardian Dashboard AI Database Schema
-- PostgreSQL with PostGIS extension for geospatial data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE disaster_type AS ENUM ('fire', 'earthquake', 'weather', 'flood', 'other');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'expired');
CREATE TYPE agent_status AS ENUM ('online', 'warning', 'offline', 'error');
CREATE TYPE notification_channel AS ENUM ('sms', 'email', 'push', 'webhook', 'social');
CREATE TYPE notification_status AS ENUM ('queued', 'sending', 'sent', 'delivered', 'failed', 'read');

-- ====================
-- Users Table (synced with Descope)
-- ====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descope_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    roles TEXT[] DEFAULT ARRAY['user'],
    preferences JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{
        "channels": ["email"],
        "severity_threshold": "high",
        "quiet_hours": null,
        "language": "en"
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_descope_id ON users(descope_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roles ON users USING GIN(roles);

-- ====================
-- Disasters Table
-- ====================
CREATE TABLE disasters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255),
    type disaster_type NOT NULL,
    severity severity_level NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    location_name VARCHAR(500),
    affected_radius_km DECIMAL(10, 2),
    affected_area GEOGRAPHY(POLYGON, 4326),
    data JSONB DEFAULT '{}',
    source VARCHAR(100),
    detected_by VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    is_simulation BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_disasters_type ON disasters(type);
CREATE INDEX idx_disasters_severity ON disasters(severity);
CREATE INDEX idx_disasters_location ON disasters USING GIST(location);
CREATE INDEX idx_disasters_affected_area ON disasters USING GIST(affected_area);
CREATE INDEX idx_disasters_started_at ON disasters(started_at);
CREATE INDEX idx_disasters_external_id ON disasters(external_id);

-- ====================
-- Alerts Table
-- ====================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity severity_level NOT NULL,
    status alert_status DEFAULT 'active',
    location GEOGRAPHY(POINT, 4326),
    location_name VARCHAR(500),
    affected_zones UUID[],
    metadata JSONB DEFAULT '{}',
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_disaster_id ON alerts(disaster_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_location ON alerts USING GIST(location);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_expires_at ON alerts(expires_at);

-- ====================
-- Alert Zones Table (User-defined geographic areas)
-- ====================
CREATE TABLE alert_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    zone_polygon GEOGRAPHY(POLYGON, 4326) NOT NULL,
    disaster_types disaster_type[],
    severity_threshold severity_level DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alert_zones_user_id ON alert_zones(user_id);
CREATE INDEX idx_alert_zones_zone_polygon ON alert_zones USING GIST(zone_polygon);
CREATE INDEX idx_alert_zones_is_active ON alert_zones(is_active);

-- ====================
-- Agent Logs Table
-- ====================
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50),
    status agent_status NOT NULL,
    message TEXT,
    metrics JSONB DEFAULT '{}',
    activity_data JSONB DEFAULT '{}',
    error_details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX idx_agent_logs_status ON agent_logs(status);
CREATE INDEX idx_agent_logs_timestamp ON agent_logs(timestamp);

-- Create partitioned table for better performance with time-series data
CREATE TABLE agent_logs_partitioned (
    LIKE agent_logs INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions (example for next 3 months)
CREATE TABLE agent_logs_2025_08 PARTITION OF agent_logs_partitioned
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE agent_logs_2025_09 PARTITION OF agent_logs_partitioned
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE agent_logs_2025_10 PARTITION OF agent_logs_partitioned
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- ====================
-- Notification History Table
-- ====================
CREATE TABLE notification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    recipient_contact VARCHAR(500) NOT NULL,
    subject VARCHAR(500),
    message TEXT NOT NULL,
    status notification_status DEFAULT 'queued',
    priority VARCHAR(20) DEFAULT 'normal',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_alert_id ON notification_history(alert_id);
CREATE INDEX idx_notification_history_channel ON notification_history(channel);
CREATE INDEX idx_notification_history_status ON notification_history(status);
CREATE INDEX idx_notification_history_created_at ON notification_history(created_at);

-- ====================
-- API Keys Table (for external service credentials)
-- ====================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    encrypted_key TEXT NOT NULL, -- Encrypted with pgcrypto
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, service_name)
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_service_name ON api_keys(service_name);

-- ====================
-- System Statistics Table
-- ====================
CREATE TABLE system_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL,
    metric_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_statistics_metric_name ON system_statistics(metric_name);
CREATE INDEX idx_system_statistics_timestamp ON system_statistics(timestamp);

-- ====================
-- Session Table (for user sessions)
-- ====================
CREATE TABLE sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_sessions_expire ON sessions(expire);

-- ====================
-- Helper Functions
-- ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disasters_updated_at BEFORE UPDATE ON disasters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_zones_updated_at BEFORE UPDATE ON alert_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to find disasters within a geographic area
CREATE OR REPLACE FUNCTION find_disasters_in_area(
    center_lat DOUBLE PRECISION,
    center_lon DOUBLE PRECISION,
    radius_km DOUBLE PRECISION
) RETURNS SETOF disasters AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM disasters
    WHERE ST_DWithin(
        location::geography,
        ST_MakePoint(center_lon, center_lat)::geography,
        radius_km * 1000
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a point is within any user's alert zones
CREATE OR REPLACE FUNCTION check_alert_zones(
    point_lat DOUBLE PRECISION,
    point_lon DOUBLE PRECISION
) RETURNS TABLE(zone_id UUID, user_id UUID, zone_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT id, alert_zones.user_id, name
    FROM alert_zones
    WHERE is_active = true
    AND ST_Within(
        ST_MakePoint(point_lon, point_lat)::geography,
        zone_polygon
    );
END;
$$ LANGUAGE plpgsql;

-- ====================
-- Initial Admin User (password will be managed by Descope)
-- ====================
INSERT INTO users (descope_id, email, name, roles, preferences)
VALUES (
    'admin_descope_id',
    'admin@guardian.ai',
    'System Administrator',
    ARRAY['admin', 'user'],
    '{"theme": "dark", "notifications": true}'
) ON CONFLICT DO NOTHING;

-- ====================
-- Sample Alert Zones for Demo
-- ====================
INSERT INTO alert_zones (user_id, name, zone_polygon, disaster_types, severity_threshold)
SELECT 
    id,
    'San Francisco Bay Area',
    ST_MakePolygon(ST_GeomFromText('LINESTRING(-122.5 37.2, -122.5 38.0, -121.5 38.0, -121.5 37.2, -122.5 37.2)', 4326))::geography,
    ARRAY['earthquake', 'fire']::disaster_type[],
    'medium'
FROM users WHERE email = 'admin@guardian.ai'
ON CONFLICT DO NOTHING;

-- ====================
-- Indexes for Performance
-- ====================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disasters_composite 
    ON disasters(type, severity, started_at DESC);
    
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_composite 
    ON alerts(status, severity, created_at DESC);

-- ====================
-- Maintenance Comments
-- ====================
COMMENT ON TABLE disasters IS 'Stores all detected disasters from various sources';
COMMENT ON TABLE alerts IS 'Stores alerts generated from disasters for user notification';
COMMENT ON TABLE users IS 'User accounts synced with Descope authentication';
COMMENT ON TABLE alert_zones IS 'User-defined geographic areas for monitoring';
COMMENT ON TABLE agent_logs IS 'Logs from AI agents for monitoring and debugging';
COMMENT ON TABLE notification_history IS 'History of all notifications sent to users';

-- Grant permissions (adjust based on your user setup)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO guardian;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO guardian;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO guardian;