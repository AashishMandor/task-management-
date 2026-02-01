import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const taskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in-progress', 'completed']),
  dueDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }),
});