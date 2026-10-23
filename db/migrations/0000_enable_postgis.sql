-- PostGIS must exist before any geography columns are created.
-- Locally the Docker image already has it; on Azure, allow-list POSTGIS in the server parameters first.
CREATE EXTENSION IF NOT EXISTS postgis;
