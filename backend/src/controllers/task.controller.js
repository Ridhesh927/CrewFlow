const taskService = require('../services/task.service');

const getTasks = async (request, reply) => {
  try {
    const tasks = await taskService.getTasks(request.user);
    return { success: true, tasks };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    throw error;
  }
};

const createTask = async (request, reply) => {
  try {
    const task = await taskService.createTask(request.body);
    return { success: true, task };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    throw error;
  }
};

const fillTaskSheet = async (request, reply) => {
  try {
    const internId = request.user.id;
    const parts = request.parts();
    const proof = await taskService.fillTaskSheet(internId, parts);
    return { success: true, proof };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    throw error;
  }
};

const getPendingProofs = async (request, reply) => {
  try {
    const proofs = await taskService.getPendingProofs(request.user);
    return { success: true, proofs };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    throw error;
  }
};

const approveProof = async (request, reply) => {
  try {
    const proofId = parseInt(request.params.id);
    const proof = await taskService.approveProof(proofId);
    return { success: true, proof };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    throw error;
  }
};

const rejectProof = async (request, reply) => {
  try {
    const proofId = parseInt(request.params.id);
    const proof = await taskService.rejectProof(proofId);
    return { success: true, proof };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    throw error;
  }
};

module.exports = { getTasks, createTask, fillTaskSheet, getPendingProofs, approveProof, rejectProof };
