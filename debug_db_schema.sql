-- 1. List all tables in the public schema
SELECT tablename 
FROM pg_catalog.pg_tables 
WHERE schemaname = 'public';

-- 2. Check the schema of specific tables
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name IN (
        'users', 'properties', 'bookings', 'courses', 
        'user_progress', 'marketplace_products', 'groups', 
        'group_members', 'farm_records'
    )
ORDER BY 
    table_name, ordinal_position;

-- 3. Check for any Row Level Security (RLS) policies that might be blocking inserts
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM 
    pg_policies
WHERE 
    schemaname = 'public';
