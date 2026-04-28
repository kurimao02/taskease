import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, GripVertical, Send, MessageSquare } from 'lucide-react';
import { useTaskStore, Task, Priority, TaskStatus, Subtask, TaskComment } from '@/src/store/useTaskStore';
import { format, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { auth } from '../firebase';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task;
}

export function TaskModal({ isOpen, onClose, taskToEdit }: TaskModalProps) {
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [notes, setNotes] = useState('');
  const [groupId, setGroupId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const groups = useTaskStore(state => state.groups);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setSubject(taskToEdit.subject);
      setDueDate(format(parseISO(taskToEdit.dueDate), "yyyy-MM-dd'T'HH:mm"));
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status || (taskToEdit.completed ? 'done' : 'todo'));
      setNotes(taskToEdit.notes);
      setGroupId(taskToEdit.groupId || '');
      setAssignedTo(taskToEdit.assignedTo || '');
      setSubtasks(taskToEdit.subtasks || []);
      setComments(taskToEdit.comments || []);
    } else {
      setTitle('');
      setSubject('');
      setDueDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setPriority('medium');
      setStatus('todo');
      setNotes('');
      setGroupId('');
      setAssignedTo('');
      setSubtasks([]);
      setComments([]);
      setNewComment('');
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, {
      id: Math.random().toString(36).substring(7),
      title: newSubtaskTitle.trim(),
      completed: false
    }]);
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !auth.currentUser?.email) return;
    const newCommentObj: TaskComment = {
      id: Math.random().toString(36).substring(7),
      text: newComment.trim(),
      createdBy: auth.currentUser.email,
      createdAt: new Date().toISOString()
    };
    
    const updatedComments = [...comments, newCommentObj];
    setComments(updatedComments);
    setNewComment('');
    
    // Auto-save the comment immediately if it's an existing task
    if (taskToEdit) {
      updateTask(taskToEdit.id, { comments: updatedComments });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-update legacy 'completed' flag based on status
    const isCompleted = status === 'done';

    const taskData = {
      title,
      subject,
      dueDate: new Date(dueDate).toISOString(),
      priority,
      status,
      notes,
      groupId,
      assignedTo: assignedTo || null,
      subtasks,
      comments,
      completed: isCompleted
    };

    if (taskToEdit) {
      updateTask(taskToEdit.id, taskData);
    } else {
      addTask(taskData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-lg my-8 relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {taskToEdit ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-shadow text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., Read Chapter 5"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject/Category</label>
                <input 
                  type="text" 
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-shadow text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="e.g., Biology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Group / Project</label>
                <select 
                  value={groupId}
                  onChange={(e) => {
                    setGroupId(e.target.value);
                    setAssignedTo(''); // reset assigned user when group changes
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-shadow text-gray-900 dark:text-white"
                >
                  <option value="">Personal</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>Group: {g.name}</option>
                  ))}
                </select>
              </div>
              {groupId && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assign To Member</label>
                  <select 
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-shadow text-gray-900 dark:text-white"
                  >
                    <option value="">Unassigned</option>
                    {groups.find(g => g.id === groupId)?.memberEmails.map(email => (
                      <option key={email} value={email}>{email}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-shadow text-gray-900 dark:text-white select-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-shadow text-gray-900 dark:text-white"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due Date & Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-shadow text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subtasks / Checklist</label>
              <div className="space-y-2 mb-3">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 group/st">
                    <input 
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => toggleSubtask(st.id)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={cn("text-sm flex-1", st.completed ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300")}>
                      {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(st.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover/st:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-shadow text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Add a subtask..."
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes/Description</label>
              <textarea 
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-shadow resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Add any additional details, links to docs, etc..."
              />
            </div>
          </form>

          {taskToEdit && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white mb-4">
                <MessageSquare size={16} />
                Task Comments
              </h3>
              
              <div className="space-y-4 mb-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No comments yet. Start the discussion!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">
                          {comment.createdBy.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {format(parseISO(comment.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-shadow text-sm text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="Type a comment..."
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 pt-4 px-6 py-5 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/80 rounded-b-3xl">
          {taskToEdit ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  deleteTask(taskToEdit.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          ) : (
            <div></div>
          )}
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="task-form"
              className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
            >
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
