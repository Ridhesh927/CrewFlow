const { z } = require('zod');

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(5, 'Description is required'),
    deadline: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/)),
    targetAudience: z.string().min(2, 'Target audience is required'),
    subTasks: z.array(z.string().min(1, 'Subtask cannot be empty')).optional(),
  })
});

const submitProofSchema = z.object({
  body: z.object({
    taskId: z.string().regex(/^\d+$/, 'taskId must be a number'),
    completedSubTasks: z.string().optional(),
    image: z.any().optional(),
  })
});

module.exports = { createTaskSchema, submitProofSchema };
