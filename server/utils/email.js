const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// Email configuration
let transporter = null;
let emailEnabled = false;

// Initialize email transporter
function initEmail() {
  const emailHost = process.env.SMTP_HOST;
  const emailPort = process.env.SMTP_PORT || 587;
  const emailUser = process.env.SMTP_USER;
  const emailPass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM || emailUser;

  if (emailHost && emailUser && emailPass) {
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: emailPort === '465',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
    emailEnabled = true;
    console.log('📧 Email notifications enabled');
  } else {
    console.log('📧 Email notifications disabled (no SMTP configured)');
  }
}

// Send email helper
async function sendEmail(to, subject, html, text) {
  if (!emailEnabled || !transporter) {
    console.log(`[Email] Would send to ${to}: ${subject}`);
    return { success: true, mock: true };
  }

  try {
    const result = await transporter.sendMail({
      from: `"Micro-CRM" <${process.env.SMTP_FROM || 'noreply@microcrm.com'}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    });
    
    console.log(`[Email] Sent to ${to}: ${subject}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return { success: false, error: error.message };
  }
}

// Email templates
const EmailTemplates = {
  welcome: (user) => ({
    subject: 'Welcome to Micro-CRM!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Welcome to Micro-CRM!</h1>
        <p>Hi ${user.name},</p>
        <p>Thank you for signing up for Micro-CRM. Your account has been created successfully.</p>
        <p>You can now:</p>
        <ul>
          <li>Manage your clients and projects</li>
          <li>Track tasks and time</li>
          <li>Create and send invoices</li>
          <li>And much more!</li>
        </ul>
        <p>Get started by logging in to your dashboard.</p>
        <p>Best regards,<br>The Micro-CRM Team</p>
      </div>
    `
  }),

  invoiceCreated: (invoice, user) => ({
    subject: `New Invoice Created: ${invoice.invoice_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">New Invoice</h1>
        <p>Hi ${user.name},</p>
        <p>A new invoice has been created:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Invoice #</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${invoice.invoice_number}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Client</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${invoice.client_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Total</td>
            <td style="padding: 8px; border: 1px solid #ddd;">$${invoice.total.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Due Date</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${invoice.due_date || 'N/A'}</td>
          </tr>
        </table>
        <p>Log in to your Micro-CRM dashboard to view and send the invoice.</p>
      </div>
    `
  }),

  invoicePaid: (invoice, user) => ({
    subject: `Invoice Paid: ${invoice.invoice_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Invoice Paid!</h1>
        <p>Hi ${user.name},</p>
        <p>Great news! Invoice <strong>${invoice.invoice_number}</strong> has been marked as paid.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Amount</td>
            <td style="padding: 8px; border: 1px solid #ddd;">$${invoice.total.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Client</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${invoice.client_name}</td>
          </tr>
        </table>
      </div>
    `
  }),

  projectStatusChanged: (project, user) => ({
    subject: `Project Status Updated: ${project.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Project Updated</h1>
        <p>Hi ${user.name},</p>
        <p>The project <strong>${project.name}</strong> has been updated.</p>
        <p>New status: <strong>${project.status}</strong></p>
        ${project.progress !== undefined ? `<p>Progress: ${project.progress}%</p>` : ''}
      </div>
    `
  }),

  passwordReset: (user, resetToken) => ({
    subject: 'Reset your Micro-CRM password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Reset Password</h1>
        <p>Hi ${user.name},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <p style="margin: 30px 0;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}" 
             style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  })
};

// API endpoint for sending notifications
function setupNotificationRoutes(app) {
  // Test email endpoint
  app.post('/api/notifications/test', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      const result = await sendEmail(email, 'Test Email', '<p>This is a test email from Micro-CRM.</p>');
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send invoice notification
  app.post('/api/notifications/invoice', async (req, res) => {
    try {
      const { type, invoice, user } = req.body;
      const template = EmailTemplates[`invoice${type}`];
      
      if (!template) {
        return res.status(400).json({ error: 'Invalid notification type' });
      }
      
      const { subject, html } = template(invoice, user);
      const result = await sendEmail(user.email, subject, html);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  initEmail,
  sendEmail,
  EmailTemplates,
  setupNotificationRoutes
};
