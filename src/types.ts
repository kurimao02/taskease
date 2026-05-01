export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  text: string;
  createdBy: string; // User email
  createdAt: string; // ISO string
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // ISO string
  priority: Priority;
  status?: TaskStatus; // NEW: Track actual progress
  subtasks?: Subtask[]; // NEW: Break down large tasks
  comments?: TaskComment[]; // NEW: Task discussion
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
  invitedEmails?: string[]; // NEW: People invited but haven't accepted
  createdBy: string;
  createdAt: any;
}

export interface UserProfile {
  id: string; // auth uid
  email: string;
  displayName?: string;
  photoURL?: string;
  friends: string[]; // array of emails
  friendRequests: string[]; // array of emails
}

export interface ChatMessage {
  id: string;
  text: string;
  senderEmail: string;
  createdAt: any;
}

export interface Chat {
  id: string; // can be "chat_email1_email2"
  participants: string[]; // array of emails
  updatedAt: any;
  lastMessage?: string;
}
