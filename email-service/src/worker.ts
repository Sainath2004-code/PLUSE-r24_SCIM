import { Worker, Job } from 'bullmq';
import { sendEmail } from './services/emailSender.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const redisConnection = { host: '127.0.0.1', port: 6379 };

console.log('Starting Email Worker...');

const worker = new Worker('email-sending', async (job: Job) => {
  console.log(`Processing job ${job.name} (ID: ${job.id})`);

  if (job.name === 'send-email') {
    const { emailId, to, subject, body } = job.data;
    
    try {
      // Send the email
      const result = await sendEmail({ to, subject, html: body });
      
      // Log Success
      await supabase.from('email_logs').insert({
        email_id: emailId,
        event_type: 'sent',
        event_data: result
      });

      // Update Email Status
      await supabase.from('emails')
        .update({ status: 'sent', sent_at: new Date().toISOString(), folder: 'sent' })
        .eq('id', emailId);

      return { status: 'Success', result };
    } catch (error: any) {
      console.error(`Error sending email ${emailId}:`, error);

      // Log Failure
      await supabase.from('email_logs').insert({
        email_id: emailId,
        event_type: 'failed',
        event_data: { error: error.message }
      });

      await supabase.from('emails')
        .update({ status: 'failed' })
        .eq('id', emailId);

      throw error; // Will trigger BullMQ retries
    }
  }

  if (job.name === 'workflow-action') {
     const { workflowId, payload } = job.data;
     console.log(`Executing workflow ${workflowId} with payload`, payload);
     // Workflow execution logic here...
     return { status: 'Workflow Processed' };
  }

}, { connection: redisConnection });

worker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
