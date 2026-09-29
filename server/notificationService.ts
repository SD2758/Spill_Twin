/**
 * Real-world Email & SMS Gateway Notification Service
 * Supports Resend, Nodemailer (SMTP / Gmail), SendGrid, and Twilio SMS.
 */

import nodemailer from 'nodemailer';
import twilio from 'twilio';

export interface EmailDispatchOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  fromName?: string;
}

export interface SmsDispatchOptions {
  to: string;
  body: string;
}

export interface DispatchResult {
  attempted: boolean;
  delivered: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  details?: string;
}

// Lazy Nodemailer Transport
let smtpTransport: nodemailer.Transporter | null = null;
function getSmtpTransport(): nodemailer.Transporter | null {
  if (smtpTransport) return smtpTransport;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;

  if (host && user && pass) {
    try {
      smtpTransport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      return smtpTransport;
    } catch (err: any) {
      console.warn('[NotificationService] SMTP config note:', err.message);
    }
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    try {
      smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASS,
        },
      });
      return smtpTransport;
    } catch (err: any) {
      console.warn('[NotificationService] Gmail SMTP config note:', err.message);
    }
  }

  return null;
}

// Lazy Twilio Client
let twilioClient: any = null;
function getTwilioClient(): any {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken) {
    try {
      twilioClient = twilio(accountSid, authToken);
      return twilioClient;
    } catch (err: any) {
      console.warn('[NotificationService] Twilio init note:', err.message);
    }
  }
  return null;
}

/**
 * Send real email to recipient inboxes
 */
export async function sendRealEmail(options: EmailDispatchOptions): Promise<DispatchResult> {
  const toList = Array.isArray(options.to) ? options.to : [options.to];
  const recipientStr = toList.join(', ');

  // 1. Try Resend API if key is present
  if (process.env.RESEND_API_KEY) {
    try {
      const fromAddr = process.env.SMTP_FROM || 'SpillTwin SAR Alerts <onboarding@resend.dev>';
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddr,
          to: toList,
          subject: options.subject,
          text: options.text,
          html: options.html || `<div style="font-family: sans-serif; white-space: pre-wrap; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">${options.text}</div>`,
        }),
      });

      const data: any = await resp.json();
      if (resp.ok && data?.id) {
        console.log(`[NotificationService] Email delivered via Resend API to ${recipientStr}. ID: ${data.id}`);
        return {
          attempted: true,
          delivered: true,
          provider: 'Resend API Gateway',
          messageId: data.id,
          details: `Delivered to ${recipientStr} via Resend.`,
        };
      } else {
        console.warn(`[NotificationService] Resend delivery response:`, data);
      }
    } catch (resendErr: any) {
      console.warn('[NotificationService] Resend API error:', resendErr.message);
    }
  }

  // 2. Try Nodemailer SMTP (Custom Host or Gmail)
  const transport = getSmtpTransport();
  if (transport) {
    try {
      const fromAddr = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'alerts@spilltwin.maritime.gov';
      const info = await transport.sendMail({
        from: `"${options.fromName || 'SpillTwin SAR Sentinel'}" <${fromAddr}>`,
        to: recipientStr,
        subject: options.subject,
        text: options.text,
        html: options.html || `<div style="font-family: sans-serif; white-space: pre-wrap; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">${options.text}</div>`,
      });

      console.log(`[NotificationService] Email sent via SMTP to ${recipientStr}. MessageId: ${info.messageId}`);
      return {
        attempted: true,
        delivered: true,
        provider: 'SMTP / Mail Transfer Agent',
        messageId: info.messageId,
        details: `Dispatched to ${recipientStr} via SMTP server.`,
      };
    } catch (smtpErr: any) {
      console.error('[NotificationService] SMTP error:', smtpErr.message);
      return {
        attempted: true,
        delivered: false,
        provider: 'SMTP Server',
        error: smtpErr.message,
        details: 'Failed to connect to SMTP host. Please verify SMTP_HOST, SMTP_USER, and SMTP_PASS credentials.',
      };
    }
  }

  // 3. Try SendGrid API
  if (process.env.SENDGRID_API_KEY) {
    try {
      const fromAddr = process.env.SMTP_FROM || 'alerts@spilltwin.maritime.gov';
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: toList.map((email) => ({ email })) }],
          from: { email: fromAddr, name: options.fromName || 'SpillTwin SAR Sentinel' },
          subject: options.subject,
          content: [
            { type: 'text/plain', value: options.text },
            { type: 'text/html', value: options.html || `<p>${options.text}</p>` },
          ],
        }),
      });

      if (resp.status >= 200 && resp.status < 300) {
        console.log(`[NotificationService] Email delivered via SendGrid to ${recipientStr}`);
        return {
          attempted: true,
          delivered: true,
          provider: 'SendGrid API',
          details: `Delivered to ${recipientStr} via SendGrid.`,
        };
      }
    } catch (sendgridErr: any) {
      console.warn('[NotificationService] SendGrid error:', sendgridErr.message);
    }
  }

  // If no email credentials configured in .env
  return {
    attempted: false,
    delivered: false,
    provider: 'Direct Client Mail Gateway (mailto / local queue)',
    details: 'No server SMTP/Resend credentials in .env. Formatted POLREP is queued for immediate 1-click transmission via client mail app.',
  };
}

/**
 * Send real SMS to mobile phone numbers
 */
export async function sendRealSms(options: SmsDispatchOptions): Promise<DispatchResult> {
  const client = getTwilioClient();
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM;

  if (client && twilioFrom) {
    try {
      // Normalize recipient phone number
      const sanitizedPhone = options.to.replace(/[^\d+]/g, '');
      const message = await client.messages.create({
        body: options.body,
        from: twilioFrom,
        to: sanitizedPhone,
      });

      console.log(`[NotificationService] SMS delivered via Twilio to ${sanitizedPhone}. SID: ${message.sid}`);
      return {
        attempted: true,
        delivered: true,
        provider: 'Twilio SMS Cellular Gateway',
        messageId: message.sid,
        details: `SMS successfully queued for cellular delivery to ${sanitizedPhone} (Twilio SID: ${message.sid}).`,
      };
    } catch (twilioErr: any) {
      console.error('[NotificationService] Twilio SMS error:', twilioErr.message);
      return {
        attempted: true,
        delivered: false,
        provider: 'Twilio SMS',
        error: twilioErr.message,
        details: `Twilio delivery rejected: ${twilioErr.message}. Ensure destination number includes country code (+91, +1, etc.).`,
      };
    }
  }

  return {
    attempted: false,
    delivered: false,
    provider: 'Direct Client Cellular Gateway (SMS / WhatsApp)',
    details: 'No TWILIO_ACCOUNT_SID configured in .env. Dispatched via instant 1-click SMS & WhatsApp action links.',
  };
}

/**
 * Get gateway status check
 */
export function getNotificationGatewayStatus() {
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasSmtp = Boolean(
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS)
  );
  const hasSendGrid = Boolean(process.env.SENDGRID_API_KEY);
  const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM));

  return {
    emailServices: {
      active: hasResend || hasSmtp || hasSendGrid,
      primaryProvider: hasResend ? 'Resend API' : hasSmtp ? 'SMTP / Mail Transfer Agent' : hasSendGrid ? 'SendGrid' : 'Client Mail App (mailto)',
      hasResend,
      hasSmtp,
      hasSendGrid,
    },
    smsServices: {
      active: hasTwilio,
      primaryProvider: hasTwilio ? 'Twilio Cellular Gateway' : 'Client SMS / WhatsApp Link',
      hasTwilio,
    },
    envGuide: {
      emailVariables: ['RESEND_API_KEY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'GMAIL_USER', 'GMAIL_APP_PASS'],
      smsVariables: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    },
  };
}
