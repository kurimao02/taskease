import React, { useState, useMemo } from 'react';
import { Plus, Filter, CheckCircle2, Circle, Clock, Calendar as CalendarIcon, LayoutList, LayoutGrid } from 'lucide-react';
import { useTaskStore, Task, TaskStatus } from '@/src/store/useTaskStore';
import { TaskModal } from '@/src/components/TaskModal';
import { isToday, isThisWeek, parseISO, format, isAfter, startOfToday } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/src/lib/utils';
import { useThemeStore } from '@/src/store/useThemeStore';

const priorityColors = {
  high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50',
  medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  low: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
};

const priorityDotColors = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500'
};

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  
  const tasks = useTaskStore(state => state.tasks);
  const toggleTaskCompletion = useTaskStore(state => state.toggleTaskCompletion);
  const updateTask = useTaskStore(state => state.updateTask);
  const theme = useThemeStore(state => state.theme);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => (filter === 'all' || t.priority === filter));
  }, [tasks, filter]);

  const todayTasks = useMemo(() => {
    return filteredTasks.filter(t => 
      !t.completed && 
      isToday(parseISO(t.dueDate))
    ).sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
  }, [filteredTasks]);

  const upcomingTasks = useMemo(() => {
    return filteredTasks.filter(t => 
      !t.completed && 
      isThisWeek(parseISO(t.dueDate)) && 
      isAfter(parseISO(t.dueDate), startOfToday()) &&
      !isToday(parseISO(t.dueDate))
    ).sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
  }, [filteredTasks]);

  const progressData = useMemo(() => {
    const thisWeekTasks = tasks.filter(t => isThisWeek(parseISO(t.dueDate)));
    const completed = thisWeekTasks.filter(t => t.completed).length;
    const pending = thisWeekTasks.length - completed;
    const percentage = thisWeekTasks.length > 0 ? Math.round((completed / thisWeekTasks.length) * 100) : 0;
    
    return {
      chartData: [
        { name: 'Completed', value: completed, color: '#10b981' },
        { name: 'Pending', value: pending, color: theme === 'dark' ? '#818cf8' : '#6366f1' }
      ],
      percentage
    };
  }, [tasks, theme]);

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleOpenNewTask = () => {
    setTaskToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTask(taskId, { status: newStatus, completed: newStatus === 'done' });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const TaskItem: React.FC<{ task: Task, isBoard?: boolean }> = ({ task, isBoard }) => (
    <div 
      draggable={isBoard}
      onDragStart={(e) => handleDragStart(e, task.id)}
      className={cn(
        "group flex items-start gap-4 p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl shadow-sm hover:shadow-md dark:hover:shadow-gray-900/50 transition-all cursor-pointer",
        isBoard && "active:cursor-grabbing cursor-grab flex-col gap-3"
      )}
      onClick={() => handleEditTask(task)}
    >
      <div className={cn("flex-1 min-w-0 w-full", isBoard && "flex flex-col")}>
        <div className="flex items-start justify-between gap-2 mb-1.5 w-full">
          {!isBoard && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleTaskCompletion(task.id);
              }}
              className="mt-1 text-gray-300 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
            >
              {task.completed ? <CheckCircle2 className="text-emerald-500" size={24} strokeWidth={1.5} /> : <Circle size={24} strokeWidth={1.5} />}
            </button>
          )}
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate text-base flex-1">{task.title}</h3>
          <span className={cn("shrink-0 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-semibold border", priorityColors[task.priority])}>
            {task.priority}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2 w-full">
          <span className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className={cn("w-2 h-2 rounded-full", priorityDotColors[task.priority])} />
            <span className="truncate max-w-[120px]">{task.subject}</span>
          </span>
          {!isBoard && task.status && task.status !== 'todo' && (
            <span className={cn(
              "px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wider uppercase border",
              task.status === 'in-progress' ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50"
            )}>
              {task.status.replace('-', ' ')}
            </span>
          )}
          {task.subtasks && task.subtasks.length > 0 && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
            </span>
          )}
          {task.comments && task.comments.length > 0 && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"></path></svg>
              {task.comments.length}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {format(parseISO(task.dueDate), 'h:mm a')}
          </span>
          {!isToday(parseISO(task.dueDate)) && (
            <span className="flex items-center gap-1.5 truncate">
              <CalendarIcon size={14} />
              {format(parseISO(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.assignedTo && (
            <span className="flex items-center gap-1.5 font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-0.5 rounded-full text-xs truncate max-w-[100px]">
              @{task.assignedTo.split('@')[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Here's what's happening with your tasks today.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white")}
            >
              <LayoutList size={20} />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={cn("p-2 rounded-lg transition-colors", viewMode === 'board' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white")}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <button 
            onClick={handleOpenNewTask}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {(['todo', 'in-progress', 'done'] as TaskStatus[]).map(status => (
            <div 
              key={status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              className="bg-gray-50/50 dark:bg-gray-900/20 p-4 rounded-3xl border border-gray-200/50 dark:border-gray-800 flex flex-col min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                  {status.replace('-', ' ')}
                </h3>
                <span className="bg-white dark:bg-gray-800 text-gray-500 py-1 px-2.5 rounded-full text-xs font-medium shadow-sm">
                  {filteredTasks.filter(t => t.status === status || (status === 'todo' && !t.status && !t.completed) || (status === 'done' && t.completed && t.status !== 'in-progress')).length}
                </span>
              </div>
              <div className="flex-1 space-y-3">
                {filteredTasks
                  .filter(t => t.status === status || (status === 'todo' && !t.status && !t.completed) || (status === 'done' && t.completed && t.status !== 'in-progress'))
                  .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
                  .map(task => (
                    <TaskItem key={task.id} task={task} isBoard />
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Tasks */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Tasks */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Today's Tasks
                  <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {todayTasks.length}
                  </span>
                </h2>
              </div>
              
              {todayTasks.length > 0 ? (
                <div className="space-y-3">
                  {todayTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700/50 rounded-3xl">
                  <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <CheckCircle2 className="text-emerald-500" size={24} />
                  </div>
                  <h3 className="text-gray-900 dark:text-gray-100 font-medium">You're all caught up!</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">No more tasks due today.</p>
                </div>
              )}
            </section>

            {/* Upcoming Tasks */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Upcoming This Week
                </h2>
              </div>
              
              {upcomingTasks.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {upcomingTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700/50 rounded-3xl">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming tasks for this week.</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Progress */}
          <div className="space-y-8">
            <section className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-8">Weekly Progress</h2>
              
              <div className="flex items-center justify-center mb-10 relative">
                <div className="w-36 h-36 rounded-full border-[10px] border-gray-50 dark:border-gray-700/50 flex items-center justify-center relative shadow-inner">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="62"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      className="text-indigo-600 dark:text-indigo-500 transition-all duration-1000 ease-out"
                      strokeDasharray={389.55}
                      strokeDashoffset={389.55 - (389.55 * progressData.percentage) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center flex flex-col items-center">
                    <span className="text-4xl font-light text-gray-900 dark:text-white tracking-tight">{progressData.percentage}%</span>
                  </div>
                </div>
              </div>

              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressData.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                    <Tooltip 
                      cursor={{ fill: theme === 'dark' ? '#374151' : '#f3f4f6' }}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        color: theme === 'dark' ? '#f3f4f6' : '#111827'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {progressData.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>
      )}

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        taskToEdit={taskToEdit}
      />
    </div>
  );
}

