import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkNewTables() {
  const tables = [
    'user_wallets',
    'wallet_transactions',
    'group_virtual_accounts',
    'withdrawal_requests',
    'group_withdrawal_requests',
    'group_withdrawal_approvals',
    'group_member_action_votes'
  ];

  console.log('Checking for new tables...');
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table ${table} error: ${error.message}`);
    } else {
      console.log(`✅ Table ${table} exists!`);
    }
  }

  console.log('\nChecking users table for new columns...');
  const { data: userData, error: userError } = await supabase.from('users').select('*').limit(1);
  if (userError) {
    console.log(`❌ Users table error: ${userError.message}`);
  } else if (userData && userData.length > 0) {
    const columns = Object.keys(userData[0]);
    const newColumns = [
      'nin_number', 'nin_verified', 'nin_full_name', 'nin_date_of_birth',
      'nin_gender', 'nin_address', 'nin_phone', 'profile_picture_url',
      'is_platform_subscriber', 'subscription_paid_at', 'subscription_reference'
    ];
    for (const col of newColumns) {
      if (columns.includes(col)) {
        console.log(`✅ Column users.${col} exists!`);
      } else {
        console.log(`❌ Column users.${col} MISSING!`);
      }
    }
  } else {
    console.log('⚠️ Users table empty, cannot verify columns through select *');
  }
}

checkNewTables();
