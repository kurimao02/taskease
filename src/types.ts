export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // ISO string
  priority: Priority;
  notes: string;
  completed: boolean;
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
