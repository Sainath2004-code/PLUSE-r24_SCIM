import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemoUser() {
  const email = 'admin@demo.local';
  const password = 'demoPassword123!';

  console.log(`Attempting to sign up: ${email}`);
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    if (error.message.includes('already registered')) {
         console.log('Success: Demo user is already registered.');
         console.log(`Email: ${email}`);
         console.log(`Password: ${password} (or previously set)`);
    } else {
         console.error('Error creating user:', error);
    }
  } else {
    // Note: depending on Supabase settings, the user might need email verification.
    // By default on new projects, email confirmation is enabled. If it is, they won't be able to log in
    // without clicking a link, OR they can disable it in the dashboard.
    console.log('Success: Demo user created!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    if (data?.session === null && data?.user?.identities?.length === 0) {
       console.log('Note: A user with this email already exists.');
    } else if (data?.session === null) {
       console.log('\\nIMPORTANT: Email confirmations are enabled in your Supabase project!');
       console.log('To login immediately, you MUST go to your Supabase Dashboard -> Authentication -> Providers -> Email -> Turn OFF "Confirm email", or manually confirm the user in the Users tab.');
    }
  }
}

createDemoUser();
