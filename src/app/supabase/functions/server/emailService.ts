/**
 * Email Service - Abstraction layer for email operations
 * Agnostic to the underlying email provider (IMAP/SMTP, Gmail, etc.)
 */

export interface EmailMessage {
  to: string | string[];
  subject: string;
  htmlContent: string;
  replyTo?: { email: string; name?: string };
  from?: { email: string; name?: string };
}

export interface EmailServiceConfig {
  from?: { email: string; name: string };
  replyTo?: { email: string; name: string };
}

/**
 * Abstract email service interface
 * Implementations will handle specific providers (IMAP/SMTP, Gmail, etc.)
 */
export interface IEmailService {
  sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
  // Future: add read, getAttachments, getFolder operations when implementing IMAP
}

/**
 * Email Service Factory
 * Returns the configured email service implementation
 */
export class EmailServiceFactory {
  static getService(config?: EmailServiceConfig): IEmailService {
    // For now, return a stub that throws an error
    // This will be replaced with actual implementation (IMAP/SMTP) when details are available
    return new StubEmailService(config);
  }
}

/**
 * Stub implementation - placeholder until real IMAP/SMTP is configured
 * This prevents app from crashing and gives clear error messages
 */
class StubEmailService implements IEmailService {
  private config: EmailServiceConfig;

  constructor(config?: EmailServiceConfig) {
    this.config = config || {};
  }

  async sendEmail(message: EmailMessage): Promise<{ success: boolean; error: string }> {
    console.warn('⚠️ Email service not configured yet. Email would have been sent to:', message.to);
    console.warn('   Subject:', message.subject);
    console.warn('   Configure IMAP/SMTP details to enable real email sending.');

    return {
      success: false,
      error: 'Email service not configured. Awaiting IMAP/SMTP server details.',
    };
  }
}

/**
 * Email Service Singleton
 * Usage: const emailService = getEmailService();
 */
let emailServiceInstance: IEmailService | null = null;

export function getEmailService(config?: EmailServiceConfig): IEmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = EmailServiceFactory.getService(config);
  }
  return emailServiceInstance;
}

/**
 * Helper function to wrap email HTML in professional template
 */
export function wrapEmailHtml(content: string, footerText: string = 'Cet email a été envoyé via CRM-CoreVision.'): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .email-content { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-content">
          ${content}
        </div>
        <div class="footer">
          <p>${footerText}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
