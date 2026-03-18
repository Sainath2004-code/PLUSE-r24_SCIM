import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fzamcjefnyjhptazoiah.supabase.co';
const supabaseKey = 'sb_secret_cMiPz1XvYaFsp099KDMYAQ_sB1x7f-p';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('Generating Ethereal email test account...');
  const testAccount = await nodemailer.createTestAccount();
  
  console.log('Test account created:', testAccount.user);

  console.log('Updating Supabase email_settings with test credentials...');
  const { error: updateError } = await supabase
    .from('email_settings')
    .upsert({
      id: 'default',
      smtp_provider: 'smtp',
      smtp_host: testAccount.smtp.host,
      smtp_port: testAccount.smtp.port,
      smtp_user: testAccount.user,
      smtp_pass: testAccount.pass,
      default_from_email: testAccount.user,
      default_from_name: 'PULSE-R Test Admin'
    });

  if (updateError) {
    console.error('Failed to update email_settings:', updateError);
    return;
  }

  console.log('Email settings updated successfully.');

  // Set environment variables for the emailSender module
  process.env.SUPABASE_URL = supabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = supabaseKey;

  // Import dynamically so that process.env is set before the module loads
  const { sendEmail } = await import('./services/emailSender.js');

  console.log('Sending test email...');
  try {
    const info = await sendEmail({
      to: 'test-recipient@example.com',
      subject: 'Test Email from PULSE-R',
      html: '<h1>Hello!</h1><p>This is a test email to verify the email service is working.</p>'
    });

    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

runTest();
