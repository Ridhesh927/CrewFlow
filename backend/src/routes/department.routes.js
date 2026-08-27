const departmentController = require('../controllers/department.controller');
const { requireRole } = require('../plugins/auth.middleware');
const validate = require('../plugins/validate.middleware');
const { createDepartmentSchema, updateDepartmentSchema } = require('../schemas/department.schema');

async function departmentRoutes(fastify, options) {
  // Only ADMIN can create/update/delete departments
  fastify.post(
    '/',
    { 
      preValidation: [fastify.authenticate, requireRole(['ADMIN'])],
      preHandler: [validate(createDepartmentSchema)]
    },
    departmentController.createDepartment
  );

  // All authenticated users might need to view departments (for dropdowns)
  fastify.get(
    '/',
    { preValidation: [fastify.authenticate] },
    departmentController.getDepartments
  );

  fastify.get(
    '/:id',
    { preValidation: [fastify.authenticate] },
    departmentController.getDepartment
  );

  fastify.put(
    '/:id',
    { 
      preValidation: [fastify.authenticate, requireRole(['ADMIN'])],
      preHandler: [validate(updateDepartmentSchema)]
    },
    departmentController.updateDepartment
  );

  fastify.delete(
    '/:id',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN'])] },
    departmentController.deleteDepartment
  );
}

module.exports = departmentRoutes;
