import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// BullMQ Setup (Requires Redis)
const redisConnection = { host: '127.0.0.1', port: 6379 };
const emailQueue = new Queue('email-sending', { connection: redisConnection });

// API Endpoints

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Email Management Service' });
});

// 1. Send / Schedule Email
app.post('/api/emails/send', async (req, res) => {
  try {
    const { to, subject, body, templateId, scheduledFor, delayMn } = req.body;
    
    // 1a. Save to Supabase Emails table
    const { data: emailRecord, error } = await supabase
      .from('emails')
      .insert({
        to_recipients: [{ email: to }],
        subject,
        body_html: body,
        template_id: templateId,
        status: scheduledFor || delayMn ? 'scheduled' : 'sending',
        folder: 'outbox'
      })
      .select()
      .single();

    if (error) throw error;

    // 1b. Add to BullMQ
    const jobOptions: any = {};
    if (scheduledFor) {
      const delay = new Date(scheduledFor).getTime() - Date.now();
      jobOptions.delay = Math.max(0, delay);
    } else if (delayMn) {
      jobOptions.delay = delayMn * 60 * 1000;
    }

    await emailQueue.add('send-email', { emailId: emailRecord.id, to, subject, body }, jobOptions);

    res.json({ success: true, emailId: emailRecord.id, status: 'queued' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch Templates
app.get('/api/templates', async (req, res) => {
  const { data, error } = await supabase.from('email_templates').select('*');
  if (error) return res.status(500).json({ error });
  res.json({ templates: data });
});

// 3. Trigger Automation Workflow Manually
app.post('/api/automations/trigger', async (req, res) => {
  const { eventType, payload } = req.body;
  // Look up workflows bound to this event type
  const { data: workflows, error } = await supabase
    .from('email_workflows')
    .select('*')
    .eq('trigger_event', eventType)
    .eq('is_active', true);

  if (error) return res.status(500).json({ error });

  for (const wf of workflows || []) {
     // Process actions, e.g. schedule email via BullMQ
     await emailQueue.add('workflow-action', { workflowId: wf.id, payload }, { delay: 1000 });
  }

  res.json({ triggered: (workflows || []).length });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Email Service running on port ${PORT}`);
});
