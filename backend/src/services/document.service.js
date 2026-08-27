const cloudinary = require('cloudinary').v2;
const prisma = require('../prismaClient');
const ApiError = require('../plugins/ApiError');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadDocument = async (parts, userId) => {
  let fileData = null;
  const fields = {};

  for await (const part of parts) {
    if (part.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        part.file.pipe(uploadStream);
      });
      
      fileData = {
        fileUrl: uploadResult.secure_url,
        fileType: uploadResult.format || part.mimetype
      };
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  if (!fileData) {
    throw new ApiError(400, 'No file uploaded');
  }

  const { title, description } = fields;

  const document = await prisma.document.create({
    data: {
      title: title || 'Untitled',
      description,
      fileUrl: fileData.fileUrl,
      fileType: fileData.fileType,
      uploadedBy: userId
    }
  });

  return document;
};

const getDocuments = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const documents = await prisma.document.findMany({
    skip: skip,
    take: limit,
    include: { uploader: { select: { id: true, name: true, department: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' }
  });
  const mappedDocuments = documents.map(doc => ({
    ...doc,
    uploader: doc.uploader ? { ...doc.uploader, department: doc.uploader.department } : null
  }));
  return mappedDocuments;
};

const deleteDocument = async (documentId, user) => {
  const document = await prisma.document.findUnique({
    where: { id: parseInt(documentId) }
  });
  
  if (!document) throw new ApiError(404, 'Document not found');
  
  if (user.role !== 'ADMIN' && document.uploadedBy !== user.id) {
    throw new ApiError(403, 'Unauthorized to delete this document');
  }
  
  await prisma.document.delete({
    where: { id: parseInt(documentId) }
  });
};

module.exports = {
  uploadDocument,
  getDocuments,
  deleteDocument
};
