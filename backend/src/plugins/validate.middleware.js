const { ZodError } = require('zod');

/**
 * Middleware factory to validate incoming request data against a Zod schema.
 * Adapted for Fastify's preHandler hook.
 *
 * @param {import('zod').ZodSchema} schema
 */
const validate = (schema) => {
  return async (request, reply) => {
    try {
      const parsed = schema.parse({
        body: request.body || {},
        query: request.query || {},
        params: request.params || {},
      });

      // Assign validated and sanitized data back to request
      request.body = parsed.body;
      request.query = parsed.query;
      request.params = parsed.params;
    } catch (error) {
      if (error instanceof ZodError || error.name === 'ZodError') {
        const issues = error.issues || error.errors || [];
        const formattedErrors = issues.map((err) => ({
          field: err.path.join('.').replace(/^(body|query|params)\./, ''),
          message: err.message,
        }));

        return reply.code(400).send({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      throw error;
    }
  };
};

module.exports = validate;
