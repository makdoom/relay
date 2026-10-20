
-- Automatically ensure relay_test exists on clean container initialization
SELECT 'CREATE DATABASE relay_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'relay_test')\gexec
