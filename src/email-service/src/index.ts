import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Email Service' });
});

/**
 * POST /api/emails/send
 * Body: { to, subject, body, smtp: { host, port, user, pass, fromEmail, fromName } }
 *
 * The frontend passes SMTP credentials directly so no Redis/BullMQ is needed.
 */
app.post('/api/emails/send', async (req, res) => {
  try {
    const { to, subject, body, smtp } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    // Resolve SMTP config: from request, or fall back to env vars
    const smtpHost     = smtp?.host     || process.env.SMTP_HOST     || '';
    const smtpPort     = Number(smtp?.port || process.env.SMTP_PORT || 587);
    const smtpUser     = smtp?.user     || process.env.SMTP_USER     || '';
    const smtpPass     = smtp?.pass     || process.env.SMTP_PASS     || '';
    const fromEmail    = smtp?.fromEmail || process.env.SMTP_FROM_EMAIL || smtpUser;
    const fromName     = smtp?.fromName  || process.env.SMTP_FROM_NAME  || 'PULSE-R24';

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(400).json({
        error: 'SMTP settings are missing. Please configure them in Email Settings first.'
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html: body,
    });

    console.log(`[Email] Sent to ${to} — MessageId: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error('[Email] Send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Email Service running on http://localhost:${PORT}`);
});
