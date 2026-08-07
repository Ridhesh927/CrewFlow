const taskService = require('../services/task.service');

const createTask = async (request, reply) => {
  const task = await taskService.createTask(request.body);
  return { success: true, task };
};

const fillTaskSheet = async (request, reply) => {
  const internId = request.user.id;
  const proof = await taskService.fillTaskSheet(internId, request.body);
  return { success: true, proof };
};

const approveProof = async (request, reply) => {
  const { id } = request.params;
  const proofId = parseInt(id);
  const proof = await taskService.approveProof(proofId);
  return { success: true, proof };
};

module.exports = { createTask, fillTaskSheet, approveProof };
