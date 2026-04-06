import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fzamcjefnyjhptazoiah.supabase.co';
const supabaseKey = 'sb_secret_cMiPz1XvYaFsp099KDMYAQ_sB1x7f-p';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('--- PULSE-R FULL PROJECT VERIFICATION ---');
  
  // 1. Connection Check
  console.log('\n[1] Checking Database Connection...');
  const { data: adminCheck, error: adminError } = await supabase.from('news_admins').select('count', { count: 'exact', head: true });
  if (adminError) {
    console.error('❌ Connection Failed:', adminError.message);
  } else {
    console.log('✅ Connected to Supabase.');
  }

  // 2. Core Tables Check
  console.log('\n[2] Checking Core Tables...');
  const tables = [
    'news_items', 
    'news_layout_templates', 
    'news_admins',
    'email_settings', 
    'email_templates', 
    'emails', 
    'email_workflows', 
    'email_logs'
  ];
  
  for (const table of tables) {
    try {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
          console.log(`❌ Table '${table}': Missing or Error (${error.code})`);
        } else {
          console.log(`✅ Table '${table}': Accessible (${count} records).`);
        }
    } catch (e) {
        console.log(`❌ Table '${table}': Exception thrown.`);
    }
  }

  // 3. Email Config Check
  console.log('\n[3] Checking Email Configuration...');
  const { data: emailConfig, error: configError } = await supabase.from('email_settings').select('*').eq('id', 'default').single();
  if (configError) {
    console.log('❌ Default Email Settings: Not found or error.');
  } else {
    console.log('✅ Default Email Settings: Configured.');
  }

  // 4. Storage Buckets Check
  console.log('\n[4] Checking Storage Buckets...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.log('❌ Storage: Could not list buckets.');
  } else {
    const bucketNames = (buckets || []).map(b => b.name);
    ['news-images', 'news-pdfs'].forEach(name => {
        if (bucketNames.includes(name)) {
            console.log(`✅ Bucket '${name}': Ready.`);
        } else {
            console.log(`❌ Bucket '${name}': Missing.`);
        }
    });
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
}

verify();
