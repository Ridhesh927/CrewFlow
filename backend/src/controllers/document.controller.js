const cloudinary = require('cloudinary').v2


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadDocument = async (request, reply) => {
  const parts = request.parts()
  let fileData = null
  const fields = {}

  for await (const part of parts) {
    if (part.file) {
      // Upload to Cloudinary using upload_stream
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        part.file.pipe(uploadStream)
      })
      
      fileData = {
        fileUrl: uploadResult.secure_url,
        fileType: uploadResult.format || part.mimetype
      }
    } else {
      fields[part.fieldname] = part.value
    }
  }

  if (!fileData) {
    return reply.code(400).send({ error: 'No file uploaded' })
  }

  const { title, description } = fields

  const document = await request.server.prisma.document.create({
    data: {
      title: title || 'Untitled',
      description,
      fileUrl: fileData.fileUrl,
      fileType: fileData.fileType,
      uploadedBy: request.user.id
    }
  })

  return { success: true, document }
}

const getDocuments = async (request, reply) => {
  const documents = await request.server.prisma.document.findMany({
    include: { uploader: { select: { id: true, name: true, department: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return { success: true, documents }
}

const deleteDocument = async (request, reply) => {
  const { id } = request.params
  const documentId = parseInt(id)
  
  const document = await request.server.prisma.document.findUnique({
    where: { id: documentId }
  })
  
  if (!document) return reply.code(404).send({ error: 'Document not found' })
  
  if (request.user.role !== 'ADMIN' && document.uploadedBy !== request.user.id) {
    return reply.code(403).send({ error: 'Unauthorized to delete this document' })
  }
  
  await request.server.prisma.document.delete({
    where: { id: documentId }
  })
  
  // Note: For a complete implementation, you might want to also delete the file from Cloudinary here
  
  return { success: true, message: 'Document deleted' }
}

module.exports = { uploadDocument, getDocuments, deleteDocument }
