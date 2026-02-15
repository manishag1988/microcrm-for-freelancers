describe('Email Utilities', () => {
  let emailUtils;
  let mockTransporter;
  let originalEnv;

  beforeEach(() => {
    jest.resetModules();
    originalEnv = { ...process.env };
    mockTransporter = {
      sendMail: jest.fn()
    };
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn().mockReturnValue(mockTransporter)
    }));
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('Email Templates', () => {
    beforeEach(() => {
      jest.doMock('nodemailer', () => ({
        createTransport: jest.fn()
      }));
      emailUtils = require('../server/utils/email');
    });

    it('should generate welcome email template', () => {
      const user = { name: 'John Doe', email: 'john@example.com' };
      const template = emailUtils.EmailTemplates.welcome(user);
      
      expect(template.subject).toBe('Welcome to Micro-CRM!');
      expect(template.html).toContain('Hi John Doe');
      expect(template.html).toContain('Welcome to Micro-CRM!');
    });

    it('should generate invoice created template', () => {
      const invoice = {
        invoice_number: 'INV-001',
        client_name: 'Test Client',
        total: 500,
        due_date: '2024-12-31'
      };
      const user = { name: 'John Doe' };
      const template = emailUtils.EmailTemplates.invoiceCreated(invoice, user);
      
      expect(template.subject).toBe('New Invoice Created: INV-001');
      expect(template.html).toContain('Test Client');
      expect(template.html).toContain('$500');
    });

    it('should generate invoice paid template', () => {
      const invoice = {
        invoice_number: 'INV-001',
        total: 500,
        client_name: 'Test Client'
      };
      const user = { name: 'John Doe' };
      const template = emailUtils.EmailTemplates.invoicePaid(invoice, user);
      
      expect(template.subject).toBe('Invoice Paid: INV-001');
      expect(template.html).toContain('Invoice Paid!');
      expect(template.html).toContain('$500');
    });

    it('should generate project status changed template', () => {
      const project = {
        name: 'Test Project',
        status: 'completed',
        progress: 100
      };
      const user = { name: 'John Doe' };
      const template = emailUtils.EmailTemplates.projectStatusChanged(project, user);
      
      expect(template.subject).toBe('Project Status Updated: Test Project');
      expect(template.html).toContain('completed');
      expect(template.html).toContain('100%');
    });

    it('should generate password reset template', () => {
      const user = { name: 'John Doe' };
      const resetToken = 'reset-token-123';
      const template = emailUtils.EmailTemplates.passwordReset(user, resetToken);
      
      expect(template.subject).toBe('Reset your Micro-CRM password');
      expect(template.html).toContain('reset-password');
      expect(template.html).toContain(resetToken);
    });
  });

  describe('Email Sending (Mocked)', () => {
    let sendEmail;

    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_USER = 'test@test.com';
      process.env.SMTP_PASS = 'password';
      process.env.APP_URL = 'http://localhost:3000';
      
      jest.doMock('nodemailer', () => ({
        createTransport: jest.fn().mockReturnValue(mockTransporter)
      }));
      
      jest.resetModules();
      const emailModule = require('../server/utils/email');
      emailModule.initEmail();
      sendEmail = emailModule.sendEmail;
    });

    it('should send email when SMTP is configured', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });
      
      const result = await sendEmail('to@test.com', 'Test Subject', '<p>Test</p>');
      
      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should return mock success when SMTP not configured', async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      
      jest.resetModules();
      const emailModule = require('../server/utils/email');
      emailModule.initEmail();
      const mockSendEmail = emailModule.sendEmail;
      
      const result = await mockSendEmail('to@test.com', 'Test Subject', '<p>Test</p>');
      
      expect(result.mock).toBe(true);
    });

    it('should handle email send failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      
      const result = await sendEmail('to@test.com', 'Test Subject', '<p>Test</p>');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP Error');
    });
  });

  describe('Setup Notification Routes', () => {
    it('should setup notification routes on Express app', () => {
      const mockApp = {
        post: jest.fn()
      };
      
      const { setupNotificationRoutes } = require('../server/utils/email');
      setupNotificationRoutes(mockApp);
      
      expect(mockApp.post).toHaveBeenCalledWith('/api/notifications/test', expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/api/notifications/invoice', expect.any(Function));
    });
  });
});
