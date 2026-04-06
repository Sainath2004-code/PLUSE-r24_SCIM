const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\\n');
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

async function createDemoUser() {
  const email = 'admin@demo.local';
  const password = 'demoPassword123!';

  console.log(`Attempting to sign up: ${email}`);
  
  try {
      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
              email: email,
              password: password
          })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
          if (data.msg && data.msg.includes('already registered')) {
             console.log('Success: Demo user is already registered.');
             console.log(`Email: ${email}`);
             console.log(`Password: ${password} (or previously set)`);
          } else {
             console.error('Error creating user:', data);
          }
      } else {
          console.log('Success: Demo user signup requested!');
          console.log(`Email: ${email}`);
          console.log(`Password: ${password}`);
          
          if (data.session === null && data.user && data.user.identities && data.user.identities.length === 0) {
             console.log('Note: A user with this email already exists.');
          } else if (data.session === null) {
             console.log('\\nIMPORTANT: Email confirmations are enabled in your Supabase project!');
             console.log('To login immediately, you MUST go to your Supabase Dashboard -> Authentication -> Providers -> Email -> Turn OFF "Confirm email", or manually confirm the user in the Users tab.');
          }
      }
  } catch(e) {
      console.error(e);
  }
}

createDemoUser();
