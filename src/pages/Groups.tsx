import React, { useState } from 'react';
import { Users, Plus, UserPlus, CheckSquare, Trash2, LogOut, Circle, CheckCircle2, Clock } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { auth } from '../firebase';
import { format, parseISO } from 'date-fns';
import { cn } from '../lib/utils';

const priorityColors = {
  high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50',
  medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  low: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
};

export function Groups() {
  const groups = useTaskStore(state => state.groups);
  const tasks = useTaskStore(state => state.tasks);
  const addGroup = useTaskStore(state => state.addGroup);
  const inviteMemberToGroup = useTaskStore(state => state.inviteMemberToGroup);
  const acceptGroupInvite = useTaskStore(state => state.acceptGroupInvite);
  const rejectGroupInvite = useTaskStore(state => state.rejectGroupInvite);
  const leaveGroup = useTaskStore(state => state.leaveGroup);
  const deleteGroup = useTaskStore(state => state.deleteGroup);
  const toggleTaskCompletion = useTaskStore(state => state.toggleTaskCompletion);

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await addGroup({ name: newGroupName, description: newGroupDesc });
    setIsCreatingGroup(false);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  const handleInvite = async (e: React.FormEvent, groupId: string) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    await inviteMemberToGroup(groupId, inviteEmail);
    setInviteEmail('');
    setActiveGroupId(null);
  };

  const currentUserEmail = auth.currentUser?.email || '';
  const myGroups = groups.filter(g => g.memberEmails.includes(currentUserEmail));
  const pendingGroups = groups.filter(g => g.invitedEmails?.includes(currentUserEmail));

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Groups & Shared Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Collaborate on projects with your teammates.</p>
        </div>
        <button 
          onClick={() => setIsCreatingGroup(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>New Group</span>
        </button>
      </div>

      {isCreatingGroup && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create a New Group</h2>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
              <input 
                type="text" 
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-gray-900 dark:text-white transition-shadow"
                placeholder="e.g., CS101 Final Project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input 
                type="text" 
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-gray-900 dark:text-white transition-shadow"
                placeholder="Optional description"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="submit"
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
              >
                Create Group
              </button>
              <button 
                type="button"
                onClick={() => setIsCreatingGroup(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {pendingGroups.length > 0 && (
        <div className="mb-8 p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pending Invitations</h2>
          <div className="space-y-4">
            {pendingGroups.map(group => (
              <div key={group.id} className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{group.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{group.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => rejectGroupInvite(group.id, currentUserEmail)}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => acceptGroupInvite(group.id, currentUserEmail)}
                    className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-xl transition-colors"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 border-dashed">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
            <Users size={32} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No groups yet</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            Create a group to start sharing tasks and collaborating with your classmates on projects.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {myGroups.map(group => {
            const groupTasks = tasks.filter(t => t.groupId === group.id);
            const completedTasks = groupTasks.filter(t => t.completed).length;
            const isCreator = auth.currentUser?.uid === group.createdBy;
            
            return (
              <div key={group.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                        {group.memberEmails.length} Members
                      </span>
                      {isCreator ? (
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this group?')) {
                              deleteGroup(group.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete Group"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to leave this group?')) {
                              leaveGroup(group.id, auth.currentUser?.email || '');
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Leave Group"
                        >
                          <LogOut size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{group.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-4">
                    <CheckSquare size={16} className="text-gray-400" />
                    <span>{completedTasks} / {groupTasks.length} tasks completed</span>
                  </div>
                </div>
                
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Members</h4>
                    <button 
                      onClick={() => setActiveGroupId(activeGroupId === group.id ? null : group.id)}
                      className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      <UserPlus size={14} />
                      Invite
                    </button>
                  </div>
                  
                  {activeGroupId === group.id && (
                    <form onSubmit={(e) => handleInvite(e, group.id)} className="mb-4 flex gap-2">
                      <input 
                        type="email" 
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Student email address..."
                        className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                      />
                      <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
                        Send Invite
                      </button>
                    </form>
                  )}
                  
                  <div className="space-y-2">
                    {group.memberEmails.map((email, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 group/member">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                            {email.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate">{email}</span>
                        </div>
                        {isCreator && email !== auth.currentUser?.email && (
                          <button 
                            type="button"
                            onClick={() => {
                              if(window.confirm(`Remove ${email} from this group?`)) {
                                leaveGroup(group.id, email);
                              }
                            }}
                            className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover/member:opacity-100 transition-opacity px-2 py-1"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {group.invitedEmails?.map((email, idx) => (
                      <div key={`inv-${idx}`} className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500 group/member italic">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-zinc-600 flex items-center justify-center text-xs font-medium">
                            {email.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate">{email} (Pending)</span>
                        </div>
                        {isCreator && (
                          <button 
                            type="button"
                            onClick={() => rejectGroupInvite(group.id, email)}
                            className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover/member:opacity-100 transition-opacity px-2 py-1"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Group Tasks</h4>
                    {groupTasks.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No tasks assigned yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {groupTasks.map((task) => (
                          <div key={task.id} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
                            <button 
                              onClick={() => toggleTaskCompletion(task.id)}
                              className="mt-0.5 text-gray-300 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="text-emerald-500" size={20} />
                              ) : (
                                <Circle size={20} />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <h5 className={cn("text-sm font-medium truncate", task.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-white")}>
                                  {task.title}
                                </h5>
                                <span className={cn("shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border", priorityColors[task.priority])}>
                                  {task.priority}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {format(parseISO(task.dueDate), 'MMM d, h:mm a')}
                                </span>
                                {task.assignedTo && (
                                  <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                    @{task.assignedTo.split('@')[0]}
                                  </span>
                                )}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                                    {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                  </span>
                                )}
                                {task.comments && task.comments.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"></path></svg>
                                    {task.comments.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
