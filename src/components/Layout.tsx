import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CheckSquare, Users, Bell, User as UserIcon, Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useTaskStore } from '@/src/store/useTaskStore';
import { useThemeStore } from '@/src/store/useThemeStore';
import { isToday, parseISO } from 'date-fns';
import { User } from 'firebase/auth';
import { logOut } from '@/src/firebase';

interface LayoutProps {
  user: User;
}

export function Layout({ user }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const tasks = useTaskStore(state => state.tasks);
  const { theme, toggleTheme } = useThemeStore();
  
  const urgentTasks = tasks.filter(t => 
    !t.completed && 
    t.priority === 'high' && 
    isToday(parseISO(t.dueDate))
  );
  const highPriorityDueSoon = urgentTasks.length;

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/calendar", icon: CalendarDays, label: "Calendar View" },
    { to: "/completed", icon: CheckSquare, label: "Completed Tasks" },
    { to: "/groups", icon: Users, label: "Groups/Shared" },
  ];

  return (
    <div className="flex flex-col md:flex-row font-sans transition-colors duration-200 min-h-screen relative overflow-x-hidden">
      {/* Subtle modern background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 p-4 sticky top-0 z-20 transition-colors duration-200">

        <div className="flex items-center gap-2">
          <NavLink to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <CheckSquare size={18} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight">TaskEase</span>
          </NavLink>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <Bell size={20} />
              {highPriorityDueSoon > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
              )}
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Urgent Tasks</h3>
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {urgentTasks.length > 0 ? (
                    urgentTasks.map(task => (
                      <div key={task.id} className="p-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Due today • {task.subject}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No urgent tasks due today! 🎉
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/20 dark:bg-gray-900/50 backdrop-blur-sm z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-10 h-screen w-64 pt-[72px] md:pt-0 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/50 flex flex-col transition-all duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="hidden md:flex flex-col border-b border-zinc-200 dark:border-zinc-800/50">
          <NavLink to="/" className="flex items-center gap-3 p-6 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
              <CheckSquare size={18} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white">TaskEase</span>
          </NavLink>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200",
                isActive 
                  ? "bg-gray-900 dark:bg-indigo-500/10 text-white dark:text-indigo-400 shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {item.label}
            </NavLink>
          ))}

          <div className="mt-10 px-3">
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Priorities</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></span> High
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm"></span> Medium
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span> Low
              </div>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon size={20} className="text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.displayName || 'Student User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
            <button onClick={logOut} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-end px-8 py-4 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/50 sticky top-0 z-10 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <Bell size={20} />
                {highPriorityDueSoon > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
              </button>
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Urgent Tasks</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {urgentTasks.length > 0 ? (
                      urgentTasks.map(task => (
                        <div key={task.id} className="p-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Due today • {task.subject}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No urgent tasks due today! 🎉
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
