const path = require('path');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const prisma = require('../prismaClient');
const ApiError = require('../plugins/ApiError');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.docx', '.xlsx', '.txt', '.csv'];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

function validateFileSignature(buffer, ext) {
  if (!buffer || buffer.length === 0) return false;

  // Reject executable or dangerous script signatures
  if (buffer.length >= 2 && buffer[0] === 0x4D && buffer[1] === 0x5A) {
    return false; // Windows PE executable (MZ)
  }
  if (buffer.length >= 4 && buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    return false; // ELF executable
  }
  
  const initialText = buffer.slice(0, Math.min(buffer.length, 256)).toString('utf-8').toLowerCase();
  if (initialText.includes('<?php') || initialText.includes('<script') || initialText.startsWith('#!')) {
    return false;
  }

  switch (ext) {
    case '.pdf':
      return buffer.slice(0, 4).toString('utf-8') === '%PDF';
    case '.png':
      return buffer.length >= 8 &&
        buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
        buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A;
    case '.jpg':
    case '.jpeg':
      return buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    case '.webp':
      return buffer.length >= 12 &&
        buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
        buffer.slice(8, 12).toString('ascii') === 'WEBP';
    case '.docx':
    case '.xlsx':
      // OpenXML files are ZIP archives
      return buffer.length >= 4 &&
        buffer[0] === 0x50 && buffer[1] === 0x4B &&
        (buffer[2] === 0x03 || buffer[2] === 0x05);
    case '.txt':
    case '.csv': {
      // Must not contain binary null bytes
      const sample = buffer.slice(0, Math.min(buffer.length, 1024));
      for (let i = 0; i < sample.length; i++) {
        if (sample[i] === 0) return false;
      }
      return true;
    }
    default:
      return false;
  }
}

const uploadDocument = async (parts, userId) => {
  let fileData = null;
  const fields = {};

  for await (const part of parts) {
    if (part.file) {
      const rawFilename = part.filename || 'document';
      const ext = path.extname(rawFilename).toLowerCase();
      
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new ApiError(400, `Unsupported file extension (${ext}). Allowed: PDF, Images, Word, Excel, CSV, Text.`);
      }

      if (part.mimetype && !ALLOWED_MIME_TYPES.includes(part.mimetype.toLowerCase())) {
        throw new ApiError(400, `Unsupported file MIME type (${part.mimetype}).`);
      }

      // Buffer file chunks while enforcing size cap
      const chunks = [];
      let totalSize = 0;
      for await (const chunk of part.file) {
        totalSize += chunk.length;
        if (totalSize > MAX_FILE_SIZE) {
          throw new ApiError(400, 'File exceeds maximum allowed size of 10MB');
        }
        chunks.push(chunk);
      }

      if (chunks.length === 0 || totalSize === 0) {
        throw new ApiError(400, 'Uploaded file is empty');
      }

      const fileBuffer = Buffer.concat(chunks);

      // Verify file signature (magic bytes)
      const isValidSignature = validateFileSignature(fileBuffer, ext);
      if (!isValidSignature) {
        throw new ApiError(400, 'File content signature does not match the claimed file type.');
      }

      // Sanitize filename
      const cleanBase = path.basename(rawFilename, ext).replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().substring(0, 80) || 'document';

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'documents',
            public_id: `${Date.now()}_${cleanBase}`
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        Readable.from(fileBuffer).pipe(uploadStream);
      });
      
      fileData = {
        fileUrl: uploadResult.secure_url,
        fileType: uploadResult.format || ext.replace('.', '') || part.mimetype,
        cleanFilename: `${cleanBase}${ext}`
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
      title: title || fileData.cleanFilename || 'Untitled',
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
