import React, { useState, useEffect } from 'react';
import { useSocialStore } from '../store/useSocialStore';
import { auth, db } from '../firebase';
import { UserPlus, MessageSquare, Send, Check, X, Users, Search } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, limit } from 'firebase/firestore';

export function Friends() {
  const { 
    currentUserProfile, 
    chats, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    startChat, 
    sendMessage 
  } = useSocialStore();
  
  const [activeTab, setActiveTab] = useState<'friends' | 'chats'>('friends');
  const [inviteEmail, setInviteEmail] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs: any[] = [];
      snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
      setMessages(msgs.reverse());
    });
    return () => unsub();
  }, [activeChatId]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    await sendFriendRequest(inviteEmail.trim());
    setInviteEmail('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatId) return;
    await sendMessage(activeChatId, chatInput.trim());
    setChatInput('');
  };

  const handleStartChat = async (email: string) => {
    const chatId = await startChat(email);
    if (chatId) {
      setActiveChatId(chatId);
      setActiveTab('chats');
    }
  };

  if (!currentUserProfile) return <div>Loading Profile...</div>;

  const getOtherParticipant = (participants: string[]) => {
    return participants.find(p => p !== currentUserProfile.email) || 'Unknown';
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm animate-in fade-in duration-500">
      
      {/* Sidebar */}
      <div className="w-full md:w-80 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex gap-2">
          <button 
            onClick={() => { setActiveTab('friends'); setActiveChatId(null); }}
            className={'flex-1 py-2 text-sm font-medium rounded-xl transition-colors ' + (activeTab === 'friends' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800')}
          >
            Friends
          </button>
          <button 
            onClick={() => setActiveTab('chats')}
            className={'flex-1 py-2 text-sm font-medium rounded-xl transition-colors ' + (activeTab === 'chats' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800')}
          >
            Chats
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {activeTab === 'friends' && (
            <div className="space-y-6">
              {/* Add Friend */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Add Friend</h3>
                <form onSubmit={handleSendRequest} className="relative">
                  <input
                    type="email"
                    placeholder="Friend's email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-gray-100"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </form>
              </div>

              {/* Requests */}
              {currentUserProfile.friendRequests?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-amber-500 uppercase mb-3">Friend Requests</h3>
                  <div className="space-y-2">
                    {currentUserProfile.friendRequests.map(email => (
                      <div key={email} className="flex flex-col gap-2 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-amber-200 dark:border-amber-900/30">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{email}</span>
                        <div className="flex gap-2">
                          <button onClick={() => acceptFriendRequest(email)} className="flex-1 py-1.5 flex items-center justify-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50">
                            <Check size={14}/> Accept
                          </button>
                          <button onClick={() => rejectFriendRequest(email)} className="flex-1 py-1.5 flex items-center justify-center gap-1 bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-400 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-zinc-600">
                            <X size={14}/> Ignore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friend List */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">My Friends</h3>
                {currentUserProfile.friends?.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">No friends yet. Add someone above!</div>
                ) : (
                  <div className="space-y-2">
                    {currentUserProfile.friends.map(email => (
                      <div key={email} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{email}</span>
                        <button 
                          onClick={() => handleStartChat(email)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        >
                          <MessageSquare size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-2">
              {chats.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">No active chats. Start one from your friend list.</div>
              ) : (
                chats.map(c => {
                  const otherEmail = getOtherParticipant(c.participants);
                  const isActive = activeChatId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveChatId(c.id)}
                      className={'w-full flex flex-col p-3 rounded-xl border transition-colors text-left ' + (isActive ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50' : 'bg-white border-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50')}
                    >
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate w-full">{otherEmail}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 w-full">{c.lastMessage || 'New Chat'}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900">
        {activeChatId ? (
          <>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {getOtherParticipant(chats.find(c => c.id === activeChatId)?.participants || [])}
              </h3>
            </div>
            
            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <MessageSquare size={32} className="opacity-50 mb-3" />
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderEmail === currentUserProfile.email;
                  return (
                    <div key={msg.id} className={'flex flex-col max-w-[75%] ' + (isMe ? 'ml-auto items-end' : 'mr-auto items-start')}>
                      <div className={'px-4 py-2.5 rounded-2xl ' + (isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-sm')}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 mx-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-gray-100"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={20} className="mt-0.5 ml-[-1px]" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <Users size={48} className="opacity-50 mb-4" />
            <p>Select a chat or friend to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
