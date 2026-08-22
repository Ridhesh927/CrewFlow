const departmentService = require('../services/department.service');

async function createDepartment(request, reply) {
  try {
    const department = await departmentService.createDepartment(request.body);
    return reply.code(201).send({ success: true, department });
  } catch (error) {
    request.log.error(error);
    if (error.message === 'Department with this name or code already exists') {
      return reply.code(400).send({ success: false, error: 'Bad Request', message: error.message });
    }
    return reply.code(500).send({ success: false, error: 'Internal Server Error' });
  }
}

async function getDepartments(request, reply) {
  try {
    const departments = await departmentService.getDepartments();
    return reply.code(200).send({ success: true, departments });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ success: false, error: 'Internal Server Error' });
  }
}

async function getDepartment(request, reply) {
  try {
    const { id } = request.params;
    const department = await departmentService.getDepartment(Number(id));
    if (!department) {
      return reply.code(404).send({ success: false, error: 'Not Found', message: 'Department not found' });
    }
    return reply.code(200).send({ success: true, department });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ success: false, error: 'Internal Server Error' });
  }
}

async function updateDepartment(request, reply) {
  try {
    const { id } = request.params;
    const department = await departmentService.updateDepartment(Number(id), request.body);
    return reply.code(200).send({ success: true, department });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ success: false, error: 'Internal Server Error' });
  }
}

async function deleteDepartment(request, reply) {
  try {
    const { id } = request.params;
    await departmentService.deleteDepartment(Number(id));
    return reply.code(200).send({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ success: false, error: 'Internal Server Error' });
  }
}

module.exports = {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
};
