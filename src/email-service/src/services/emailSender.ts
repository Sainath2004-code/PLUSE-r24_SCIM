import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch SMTP config from the DB
async function getEmailConfig() {
  const { data, error } = await supabase
    .from('email_settings')
    .select('*')
    .eq('id', 'default')
    .single();
    
  if (error || !data) {
    throw new Error('Default email settings not found');
  }
  return data;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const config = await getEmailConfig();
  
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_port === 465,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
  });

  const mailOptions = {
    from: `"${config.default_from_name}" <${config.default_from_email}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
