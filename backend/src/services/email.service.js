const nodemailer = require('nodemailer');

// For development, we use streamTransport to just mock the email.
// In production, configure SMTP using process.env
const transporter = nodemailer.createTransport(
  process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }
    : {
        streamTransport: true,
        newline: 'windows',
        logger: false,
      }
);

const sendPasswordResetEmail = async (toEmail, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"CrewFlow Support" <noreply@crewflow.com>',
    to: toEmail,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Click the following link to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
    html: `<p>You requested a password reset. Click the following link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, please ignore this email.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Log the link so developers can click it
    console.log('\n=======================================');
    console.log('📧 MOCK EMAIL SENT (DEVELOPMENT MODE)');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log('=======================================\n');
    
    return info;
  } catch (error) {
    console.error('Error sending mock email:', error);
    throw new Error('Failed to send reset email', { cause: error });
  }
};

const sendNotificationEmail = async (toEmail, type, message) => {
  const mailOptions = {
    from: '"CrewFlow Notifications" <noreply@crewflow.com>',
    to: toEmail,
    subject: `New Notification: ${type}`,
    text: `You have a new ${type} notification from CrewFlow:\n\n${message}\n\nLogin to your dashboard to view more details.`,
    html: `<h3>New Notification (${type})</h3><p>${message}</p><p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard">Login to Dashboard</a></p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`\n📧 NOTIFICATION EMAIL SENT to ${toEmail} [${type}]`);
    return info;
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendNotificationEmail
};
