const cron = require('node-cron');
const PDFDocument = require('pdfkit');
const prisma = require('../prismaClient');
const { sendReportEmail } = require('../services/email.service');

// Run every Friday at 5 PM
cron.schedule('0 17 * * 5', async () => {
  console.log('Running weekly report generation job...');
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    if (admins.length === 0) return;

    // Gather some stats
    const totalUsers = await prisma.user.count();
    const activeTasks = await prisma.task.count({ where: { status: 'Active' } });
    const pendingProofs = await prisma.proof.count({ where: { status: 'Pending' } });

    // Generate PDF
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    doc.fontSize(20).text('CrewFlow Weekly Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`Total Users: ${totalUsers}`);
    doc.text(`Active Campaigns: ${activeTasks}`);
    doc.text(`Proofs Pending Verification: ${pendingProofs}`);
    
    doc.end();

    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      const filename = `weekly_report_${Date.now()}.pdf`;

      for (const admin of admins) {
        await sendReportEmail(
          admin.email,
          'CrewFlow Weekly System Report',
          'Please find attached the weekly summary report for CrewFlow.',
          pdfBuffer,
          filename
        );
      }
      console.log('Weekly reports sent to admins.');
    });
  } catch (error) {
    console.error('Error generating weekly reports:', error);
  }
});
