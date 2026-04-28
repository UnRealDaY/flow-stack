import { config } from '../config';
import { logger } from './logger';

export async function sendInviteEmail(
  to: string,
  workspaceName: string,
  inviteLink: string,
): Promise<void> {
  if (config.env !== 'production') {
    logger.info({ to, workspaceName, inviteLink }, '[mailer] invite email (dev — not sent)');
    return;
  }

  // Production: swap this block for nodemailer / Resend / SES
  // const transporter = nodemailer.createTransport({ host, port, auth });
  // await transporter.sendMail({ from, to, subject, html });
  logger.warn('Production mailer not configured');
}
