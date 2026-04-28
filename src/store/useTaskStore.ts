import { create } from 'zustand';
import { Task, Group } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';

export type { Task, Group, Priority, TaskStatus, Subtask } from '../types';

interface TaskStore {
  tasks: Task[];
  groups: Group[];
  setTasks: (tasks: Task[]) => void;
  setGroups: (groups: Group[]) => void;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'userId' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  addGroup: (group: Omit<Group, 'id' | 'createdAt' | 'createdBy' | 'memberEmails'>) => Promise<void>;
  addMemberToGroup: (groupId: string, email: string) => Promise<void>;
  leaveGroup: (groupId: string, email: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  groups: [],
  setTasks: (tasks) => set({ tasks }),
  setGroups: (groups) => set({ groups }),
  
  addTask: async (taskData) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        ...taskData,
        status: taskData.status || 'todo',
        subtasks: taskData.subtasks || [],
        completed: false,
        userId: user.uid,
        groupId: taskData.groupId || "",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding task: ", error);
    }
  },
  
  updateTask: async (id, taskData) => {
    try {
      await updateDoc(doc(db, 'tasks', id), taskData);
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  },
  
  deleteTask: async (id) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  },
  
  toggleTaskCompletion: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    try {
      await updateDoc(doc(db, 'tasks', id), {
        completed: !task.completed
      });
    } catch (error) {
      console.error("Error toggling task completion: ", error);
    }
  },

  addGroup: async (groupData) => {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    try {
      await addDoc(collection(db, 'groups'), {
        ...groupData,
        createdBy: user.uid,
        memberEmails: [user.email],
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding group: ", error);
    }
  },

  addMemberToGroup: async (groupId, email) => {
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        memberEmails: arrayUnion(email)
      });
    } catch (error) {
      console.error("Error adding member: ", error);
    }
  },

  leaveGroup: async (groupId, email) => {
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        memberEmails: arrayRemove(email)
      });
    } catch (error) {
      console.error("Error leaving group: ", error);
    }
  },

  deleteGroup: async (id) => {
    try {
      await deleteDoc(doc(db, 'groups', id));
    } catch (error) {
      console.error("Error deleting group: ", error);
    }
  }
}));
