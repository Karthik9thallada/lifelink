-- ============================================================================
-- LifeLink Database Initialization Script
-- ============================================================================

-- Enable PostGIS spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS status
SELECT PostGIS_Version();
