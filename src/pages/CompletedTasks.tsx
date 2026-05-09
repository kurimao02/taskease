import React, { useState, useMemo } from 'react';
import { CheckSquare, Search, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { useTaskStore, Task } from '@/src/store/useTaskStore';
import { format, parseISO } from 'date-fns';
import { cn } from '@/src/lib/utils';

export function CompletedTasks() {
  const tasks = useTaskStore(state => state.tasks);
  const toggleTaskCompletion = useTaskStore(state => state.toggleTaskCompletion);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const completedTasks = useMemo(() => {
    return tasks.filter(t => t.completed);
  }, [tasks]);

  const subjects = useMemo(() => {
    const subs = new Set(completedTasks.map(t => t.subject));
    return Array.from(subs);
  }, [completedTasks]);

  const filteredTasks = useMemo(() => {
    return completedTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.notes.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = subjectFilter === 'all' || task.subject === subjectFilter;
      return matchesSearch && matchesSubject;
    }).sort((a, b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime());
  }, [completedTasks, searchQuery, subjectFilter]);

  const completionPercentage = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Completed Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Review your achievements and past work.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-800 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex shrink-0 items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckSquare size={26} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Completed</p>
            <p className="text-3xl font-light text-gray-900 dark:text-white tracking-tight">{completedTasks.length}</p>
          </div>
        </div>
        
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-zinc-800 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Progress</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{completionPercentage}%</p>
          </div>
          <div className="w-full bg-gray-50 dark:bg-gray-700/50 rounded-full h-3">
            <div 
              className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search completed tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-transparent rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-shadow"
          />
        </div>
        <select 
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-transparent rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[150px] transition-shadow"
        >
          <option value="all">All Subjects</option>
          {subjects.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl shadow-sm overflow-hidden">
        {filteredTasks.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {filteredTasks.map(task => (
              <div key={task.id} className="p-5 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors flex items-start sm:items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <CheckSquare size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-gray-500 dark:text-gray-400 line-through">{task.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500 mt-1">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">{task.subject}</span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon size={14} />
                        {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => toggleTaskCompletion(task.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors shrink-0"
                  >
                    <RotateCcw size={16} />
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare size={32} className="text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No completed tasks found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {completedTasks.length === 0 
                ? "You haven't completed any tasks yet. Keep going!" 
                : "No tasks match your current filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
