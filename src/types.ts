export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // ISO string
  priority: Priority;
  status?: TaskStatus; // NEW: Track actual progress
  subtasks?: Subtask[]; // NEW: Break down large tasks
  notes: string;
  completed: boolean; // Keeping for backward compatibility or simple tracking
  userId: string;
  groupId: string; // "" for personal tasks
  assignedTo?: string | null; // email of the assigned member
  createdAt: any; // Timestamp
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberEmails: string[];
  createdBy: string;
  createdAt: any;
}
