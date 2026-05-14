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
import { Friends } from './pages/Friends';
import { Login } from './pages/Login';
import { useThemeStore } from './store/useThemeStore';
import { useTaskStore } from './store/useTaskStore';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, where, or, doc } from 'firebase/firestore';
import { Task, Group } from './types';
import { useSocialStore } from './store/useSocialStore';

export default function App() {
  const theme = useThemeStore(state => state.theme);
  const setTasks = useTaskStore(state => state.setTasks);
  const setGroups = useTaskStore(state => state.setGroups);
  const groups = useTaskStore(state => state.groups);
  const initializeUserProfile = useSocialStore(state => state.initializeUserProfile);
  const setCurrentUserProfile = useSocialStore(state => state.setCurrentUserProfile);
  const setChats = useSocialStore(state => state.setChats);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [groupTasks, setGroupTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle Social Store Subscriptions
  useEffect(() => {
    if (!user) {
      setCurrentUserProfile(null);
      setChats([]);
      return;
    }

    // Subscribe to UserProfile
    const userUnsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setCurrentUserProfile(doc.data() as any);
      }
    });

    // Subscribe to Chats
    const chatsQuery = query(collection(db, 'chats'), where('participants', 'array-contains', user.email));
    const chatsUnsub = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData: any[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        if (!data.deletedFor?.includes(user.email)) {
          chatsData.push({ id: d.id, ...data });
        }
      });
      setChats(chatsData);
    });

    return () => {
      userUnsub();
      chatsUnsub();
    };
  }, [user, setCurrentUserProfile, setChats]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await initializeUserProfile(currentUser);
        // Also fire update
        import('firebase/firestore').then(({ updateDoc, doc }) => {
          updateDoc(doc(db, 'users', currentUser.uid), {
            isOnline: true,
            lastActive: new Date().toISOString()
          }).catch(console.error);
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [initializeUserProfile]);

  useEffect(() => {
    if (!user) return;

    // Heartbeat logic to keep `lastActive` fresh
    const interval = setInterval(() => {
      import('firebase/firestore').then(({ updateDoc, doc }) => {
        updateDoc(doc(db, 'users', user.uid), {
          isOnline: true,
          lastActive: new Date().toISOString()
        }).catch(() => {});
      });
    }, 60000); // 1 minute heartbeat

    // Cleanup logic
    const handleBeforeUnload = () => {
      // Use relatively synchronous way or just promise fire-and-forget
      import('firebase/firestore').then(({ updateDoc, doc }) => {
        updateDoc(doc(db, 'users', user.uid), {
          isOnline: false,
          lastActive: new Date().toISOString()
        }).catch(() => {});
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [user]);

  // Listen to Groups
  useEffect(() => {
    if (!user || !user.email) {
      setGroups([]);
      return;
    }
    const q = query(
      collection(db, 'groups'),
      or(
        where('memberEmails', 'array-contains', user.email),
        where('invitedEmails', 'array-contains', user.email)
      )
    );
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
    if (!user) return;
    const activeGroups = groups.filter(g => g.memberEmails.includes(user.email || ''));
    if (activeGroups.length === 0) {
      setGroupTasks([]);
      return;
    }
    
    // Create chunks of up to 30 for the 'in' query constraint
    const groupIds = activeGroups.map(g => g.id);
    const chunks = [];
    for (let i = 0; i < groupIds.length; i += 30) {
      chunks.push(groupIds.slice(i, i + 30));
    }

    const unsubscribes = chunks.map(chunk => {
      const q = query(collection(db, 'tasks'), where('groupId', 'in', chunk));
      return onSnapshot(q, (snapshot) => {
        const tasksData: Task[] = [];
        snapshot.forEach((doc) => {
          tasksData.push({ id: doc.id, ...doc.data() } as Task);
        });
        
        setGroupTasks(prev => {
          // Merge logic: Remove existing tasks in this chunk, then add incoming ones
          const filtered = prev.filter(t => !chunk.includes(t.groupId as string));
          return [...filtered, ...tasksData];
        });
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user, groups]);

  // Combine Tasks
  useEffect(() => {
    setTasks([...personalTasks, ...groupTasks]);
  }, [personalTasks, groupTasks, setTasks]);

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:flex flex-col w-72 border-r border-zinc-200 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 p-6 space-y-8 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-800"></div>
                <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 flex items-center justify-end px-8 border-b border-zinc-200 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 animate-pulse">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
            </div>
          </header>
          <main className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-8">
            <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/50 dark:bg-zinc-900/50 h-32 rounded-3xl border border-zinc-200 dark:border-zinc-800 animate-pulse"></div>
              ))}
            </div>
            <div className="flex flex-col lg:flex-row gap-6 h-[500px]">
              <div className="flex-1 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 animate-pulse"></div>
              <div className="w-full lg:w-1/3 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 animate-pulse"></div>
            </div>
          </main>
        </div>
      </div>
    );
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
            <Route path="friends" element={<Friends />} />
          </Route>
        ) : (
          <Route path="*" element={<Login />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

