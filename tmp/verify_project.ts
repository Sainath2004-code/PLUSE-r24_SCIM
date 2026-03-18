import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Use the .env from the root
dotenv.config({ path: path.resolve('c:/Users/yksai/OneDrive/Desktop/su r24/news-app/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fzamcjefnyjhptazoiah.supabase.co';
const supabaseKey = 'sb_secret_cMiPz1XvYaFsp099KDMYAQ_sB1x7f-p';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('--- PULSE-R PROJECT VERIFICATION ---');
  
  // 1. Connection Check
  console.log('\n[1] Checking Database Connection...');
  const { data: adminCheck, error: adminError } = await supabase.from('news_admins').select('count', { count: 'exact', head: true });
  if (adminError) {
    console.error('❌ Connection Failed:', adminError.message);
  } else {
    console.log('✅ Connected to Supabase.');
    console.log(`📊 Admin Users: ${adminCheck[0] || 0}`);
  }

  // 2. Core Tables Check
  console.log('\n[2] Checking Core Tables...');
  const tables = ['news_items', 'news_layout_templates', 'email_settings', 'email_templates', 'emails', 'email_workflows', 'email_logs'];
  
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ Table '${table}': Missing or Error (${error.code})`);
    } else {
      console.log(`✅ Table '${table}': ${count} records found.`);
    }
  }

  // 3. Email Config Check
  console.log('\n[3] Checking Email Configuration...');
  const { data: emailConfig, error: configError } = await supabase.from('email_settings').select('*').eq('id', 'default').single();
  if (configError) {
    console.log('❌ Default Email Settings: Not found.');
  } else {
    console.log('✅ Default Email Settings: Configured.');
    console.log(`   Provider: ${emailConfig.smtp_provider}`);
    console.log(`   Host: ${emailConfig.smtp_host}`);
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
}

verify();
