const documentService = require('../services/document.service');

const uploadDocument = async (request, reply) => {
  try {
    const parts = request.parts();
    const userId = request.user.id;
    
    const document = await documentService.uploadDocument(parts, userId);
    return { success: true, document };
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

const getDocuments = async (request, reply) => {
  try {
    const documents = await documentService.getDocuments();
    return { success: true, documents };
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

const deleteDocument = async (request, reply) => {
  try {
    const { id } = request.params;
    await documentService.deleteDocument(id, request.user);
    return { success: true, message: 'Document deleted' };
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

module.exports = { uploadDocument, getDocuments, deleteDocument }
