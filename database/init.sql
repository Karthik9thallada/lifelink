-- ============================================================================
-- LifeLink Database Setup Script
-- ============================================================================

-- Create database
CREATE DATABASE lifelink;

\c lifelink;

-- Enable PostGIS extension for spatial donor-hospital matching
CREATE EXTENSION IF NOT EXISTS postgis;

-- Check PostGIS installation version
SELECT PostGIS_Version();
