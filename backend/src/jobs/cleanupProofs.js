const cron = require('node-cron');
const prisma = require('../prismaClient');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const cleanupProofs = async () => {
  console.log('[Cron Job] Starting Cloudinary proof cleanup...');
  
  // Find proofs older than 24 hours that are Approved or Rejected, and still have an imageUrl
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const proofsToCleanup = await prisma.proof.findMany({
      where: {
        status: { in: ['Approved', 'Rejected'] },
        timestamp: { lt: twentyFourHoursAgo },
        imageUrl: { not: null }
      }
    });

    if (proofsToCleanup.length === 0) {
      console.log('[Cron Job] No proofs to clean up.');
      return;
    }

    let cleanedCount = 0;

    for (const proof of proofsToCleanup) {
      // Extract public_id from Cloudinary URL handling nested folders
      // Example URL: https://res.cloudinary.com/demo/image/upload/v1582236316/crewflow/proofs/sample.jpg
      const regex = /\/upload\/(?:v\d+\/)?(.+?)\.[^.]+$/;
      const match = proof.imageUrl.match(regex);
      const publicId = match ? match[1] : null;

      if (!publicId) {
        console.error(`[Cron Job] Failed to extract publicId from URL: ${proof.imageUrl}`);
        continue;
      }

      try {
        await cloudinary.uploader.destroy(publicId);
        
        await prisma.proof.update({
          where: { id: proof.id },
          data: { imageUrl: null }
        });
        cleanedCount++;
      } catch (err) {
        console.error(`[Cron Job] Failed to clean up proof ID ${proof.id}:`, err);
      }
    }

    console.log(`[Cron Job] Successfully cleaned up ${cleanedCount} proofs.`);
  } catch (error) {
    console.error('[Cron Job] Cleanup error:', error);
  }
};

// Run every day at 02:00 AM
cron.schedule('0 2 * * *', cleanupProofs, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

console.log('[Cron Job] Proof cleanup scheduled.');

module.exports = { cleanupProofs };
