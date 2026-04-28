const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.fahidkayiatnmprumvqx:Senha_Serial_24*@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected!');

  // Migration 1: shared_access permissions column
  await client.query(`
    ALTER TABLE shared_access ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb
  `);
  console.log('Added permissions column to shared_access');

  // Migration 2: migrate existing data
  await client.query(`
    UPDATE shared_access
    SET permissions = CASE
      WHEN permission_level = 'full' THEN '["dashboard","finances","categories","goals","savings","emergency","investments","life-cost","analytics"]'::jsonb
      WHEN permission_level = 'finances' THEN '["dashboard","finances","categories","goals","savings"]'::jsonb
      WHEN permission_level = 'investments' THEN '["dashboard","investments","emergency"]'::jsonb
      ELSE '[]'::jsonb
    END
    WHERE permissions = '[]'::jsonb OR permissions IS NULL
  `);
  console.log('Migrated existing shared_access data');

  // Migration 3: profiles new columns
  await client.query(`
    ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS cpf text,
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS avatar_preset text,
    ADD COLUMN IF NOT EXISTS salary_monthly numeric,
    ADD COLUMN IF NOT EXISTS work_hours_per_day numeric,
    ADD COLUMN IF NOT EXISTS work_days_per_week numeric
  `);
  console.log('Added new columns to profiles');

  await client.end();
  console.log('Migration complete!');
}

run().catch(e => { console.error(e); process.exit(1); });
