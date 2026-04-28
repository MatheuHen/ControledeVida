-- Migration 002: Advanced permissions and profile fields
ALTER TABLE shared_access ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_preset text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary_monthly numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_hours_per_day numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_days_per_week numeric;

UPDATE shared_access SET permissions = '["dashboard","finances","categories","goals","savings","emergency","investments","life-cost","analytics"]'::jsonb WHERE permission_level = 'full' AND (permissions IS NULL OR permissions = '[]'::jsonb);
UPDATE shared_access SET permissions = '["dashboard","finances","categories","goals","savings"]'::jsonb WHERE permission_level = 'finances' AND (permissions IS NULL OR permissions = '[]'::jsonb);
UPDATE shared_access SET permissions = '["dashboard","investments","emergency"]'::jsonb WHERE permission_level = 'investments' AND (permissions IS NULL OR permissions = '[]'::jsonb);
