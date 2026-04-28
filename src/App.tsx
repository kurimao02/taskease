/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CalendarView } from './pages/CalendarView';
import { CompletedTasks } from './pages/CompletedTasks';
import { Groups } from './pages/Groups';
import { Login } from './pages/Login';
import { useThemeStore } from './store/useThemeStore';
import { useTaskStore } from './store/useTaskStore';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Task, Group } from './types';

export default function App() {
  const theme = useThemeStore(state => state.theme);
  const setTasks = useTaskStore(state => state.setTasks);
  const setGroups = useTaskStore(state => state.setGroups);
  const groups = useTaskStore(state => state.groups);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [groupTasksMap, setGroupTasksMap] = useState<Record<string, Task[]>>({});

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Groups
  useEffect(() => {
    if (!user || !user.email) {
      setGroups([]);
      return;
    }
    const q = query(collection(db, 'groups'), where('memberEmails', 'array-contains', user.email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData: Group[] = [];
      snapshot.forEach((doc) => {
        groupsData.push({ id: doc.id, ...doc.data() } as Group);
      });
      setGroups(groupsData);
    });
    return () => unsubscribe();
  }, [user, setGroups]);

  // Listen to Personal Tasks
  useEffect(() => {
    if (!user) {
      setPersonalTasks([]);
      return;
    }
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid), where('groupId', '==', ''));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as Task);
      });
      setPersonalTasks(tasksData);
    });
    return () => unsubscribe();
  }, [user]);

  // Listen to Group Tasks
  useEffect(() => {
    if (!user || groups.length === 0) {
      setGroupTasksMap({});
      return;
    }
    
    const unsubscribes = groups.map(group => {
      const q = query(collection(db, 'tasks'), where('groupId', '==', group.id));
      return onSnapshot(q, (snapshot) => {
        const tasksData: Task[] = [];
        snapshot.forEach((doc) => {
          tasksData.push({ id: doc.id, ...doc.data() } as Task);
        });
        setGroupTasksMap(prev => ({ ...prev, [group.id]: tasksData }));
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, groups]);

  // Combine Tasks
  useEffect(() => {
    const allGroupTasks = Object.values(groupTasksMap).flat();
    setTasks([...personalTasks, ...allGroupTasks]);
  }, [personalTasks, groupTasksMap, setTasks]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {user ? (
          <Route path="/" element={<Layout user={user} />}>
            <Route index element={<Dashboard />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="completed" element={<CompletedTasks />} />
            <Route path="groups" element={<Groups />} />
          </Route>
        ) : (
          <Route path="*" element={<Login />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

