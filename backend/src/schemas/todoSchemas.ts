import { z } from 'zod';

export const CreateTodoSchema = z.object({
  text: z
    .string({ error: 'Text is required' })
    .trim()
    .min(1, 'Text is required')
    .max(500, 'Text must be 500 characters or fewer'),
});

export const UpdateTodoSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Text must not be empty')
    .max(500, 'Text must be 500 characters or fewer')
    .optional(),
  completed: z.boolean().optional(),
}).refine(
  (data) => data.text !== undefined || data.completed !== undefined,
  { message: 'At least one of text or completed must be provided' },
);

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
