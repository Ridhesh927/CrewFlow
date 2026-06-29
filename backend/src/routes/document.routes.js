const documentController = require('../controllers/document.controller')

async function documentRoutes(fastify, options) {
  fastify.post(
    '/',
    { preValidation: [fastify.authenticate] },
    documentController.uploadDocument
  )
  
  fastify.get(
    '/',
    { preValidation: [fastify.authenticate] },
    documentController.getDocuments
  )
  
  fastify.delete(
    '/:id',
    { preValidation: [fastify.authenticate] },
    documentController.deleteDocument
  )
}

module.exports = documentRoutes
