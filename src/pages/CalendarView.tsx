import React, { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTaskStore, Task } from '@/src/store/useTaskStore';
import { TaskModal } from '@/src/components/TaskModal';
import { cn } from '@/src/lib/utils';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  const tasks = useTaskStore(state => state.tasks);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Find tasks for this day
        const dayTasks = tasks.filter(task => isSameDay(parseISO(task.dueDate), cloneDay));

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50",
              !isSameMonth(day, monthStart) ? "text-gray-400 dark:text-gray-600 bg-gray-50/50 dark:bg-gray-900/30" : "text-gray-900 dark:text-gray-100",
              isSameDay(day, new Date()) ? "bg-indigo-50/30 dark:bg-indigo-900/20" : ""
            )}
          >
            <div className="flex justify-between items-start">
              <span className={cn(
                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                isSameDay(day, new Date()) ? "bg-indigo-600 text-white" : ""
              )}>
                {formattedDate}
              </span>
            </div>
            
            <div className="mt-2 space-y-1">
              {dayTasks.map(task => (
                <div
                  key={task.id}
                  onClick={(e) => handleTaskClick(task, e)}
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded truncate cursor-pointer transition-transform hover:scale-[1.02]",
                    task.completed ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 line-through" :
                    task.priority === 'high' ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                    task.priority === 'medium' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  )}
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  }, [currentDate, tasks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Plan your tasks across the month.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-sm p-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg text-gray-600 dark:text-gray-400">
              <ChevronLeft size={20} />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
              Today
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg text-gray-600 dark:text-gray-400">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button 
            onClick={() => { setSelectedTask(undefined); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/80">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-r border-gray-100 dark:border-gray-700/50 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {days}
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        taskToEdit={selectedTask}
      />
    </div>
  );
}
