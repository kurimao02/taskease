import React, { useState, useEffect } from 'react';
import { useSocialStore } from '../store/useSocialStore';
import { auth, db } from '../firebase';
import { UserPlus, MessageSquare, Send, Check, X, Users, Search, Trash2, MoreVertical } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, limit } from 'firebase/firestore';

export function Friends() {
  const { 
    currentUserProfile, 
    chats, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    startChat, 
    sendMessage,
    deleteMessage,
    deleteChat
  } = useSocialStore();
  
  const [activeTab, setActiveTab] = useState<'friends' | 'chats'>('friends');
  const [inviteEmail, setInviteEmail] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [deleteMessagePrompt, setDeleteMessagePrompt] = useState<string | null>(null);
  const [deleteChatPrompt, setDeleteChatPrompt] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);

  useEffect(() => {
    if (activeChatId && activeTab === 'chats') {
      const stillExists = chats.find(c => c.id === activeChatId);
      if (!stillExists) {
        setActiveChatId(null);
      }
    }
  }, [chats, activeChatId, activeTab]);

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
      snap.forEach(d => {
        const data = d.data();
        if (!data.deletedFor?.includes(currentUserProfile?.email)) {
          msgs.push({ id: d.id, ...data });
        }
      });
      setMessages(msgs.reverse());
    });
    return () => unsub();
  }, [activeChatId, currentUserProfile?.email]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    await sendFriendRequest(inviteEmail.trim());
    setInviteEmail('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !activeChatId || isSendingRef.current) return;
    
    isSendingRef.current = true;
    setIsSending(true);
    setChatInput('');
    try {
      await sendMessage(activeChatId, text);
    } catch (e) {
      console.error(e);
      setChatInput(text);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleStartChat = async (email: string) => {
    const chatId = await startChat(email);
    if (chatId) {
      setActiveChatId(chatId);
      setActiveTab('chats');
      setDeleteMessagePrompt(null);
      setDeleteChatPrompt(null);
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
                      onClick={() => {
                        setActiveChatId(c.id);
                        setDeleteMessagePrompt(null);
                        setDeleteChatPrompt(null);
                      }}
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
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50 relative">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {getOtherParticipant(chats.find(c => c.id === activeChatId)?.participants || [])}
              </h3>
              
              <div className="relative">
                <button 
                  onClick={() => setDeleteChatPrompt(deleteChatPrompt === activeChatId ? null : activeChatId)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={18} />
                </button>
                
                {deleteChatPrompt === activeChatId && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-2 z-10 flex flex-col gap-1">
                    <button 
                      onClick={async () => {
                        await deleteChat(activeChatId, false);
                        setDeleteChatPrompt(null);
                        setActiveChatId(null);
                      }}
                      className="px-3 py-2 text-xs text-left w-full hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      Delete for me
                    </button>
                    <button 
                      onClick={async () => {
                        await deleteChat(activeChatId, true);
                        setDeleteChatPrompt(null);
                        setActiveChatId(null);
                      }}
                      className="px-3 py-2 text-xs text-left w-full hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 transition-colors"
                    >
                      Delete for both
                    </button>
                  </div>
                )}
              </div>
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
                    <div key={msg.id} className={'flex flex-col max-w-[75%] group relative ' + (isMe ? 'ml-auto items-end' : 'mr-auto items-start')}>
                      <div className="flex items-center gap-2">
                        {isMe && (
                          <div className={'relative ' + (deleteMessagePrompt === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity')}>
                            <button
                              onClick={() => setDeleteMessagePrompt(deleteMessagePrompt === msg.id ? null : msg.id)}
                              className="p-1 rounded bg-white dark:bg-zinc-800 border border-black/5 shadow-sm text-gray-500 hover:text-red-500"
                            >
                              <MoreVertical size={14} />
                            </button>
                            
                            {deleteMessagePrompt === msg.id && (
                              <div className="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl rounded-lg p-1 z-20 flex flex-col">
                                <button
                                  onClick={async () => {
                                    await deleteMessage(activeChatId, msg.id, false);
                                    setDeleteMessagePrompt(null);
                                  }}
                                  className="text-xs text-left px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded-md text-gray-700 dark:text-gray-300"
                                >
                                  Delete for me
                                </button>
                                <button
                                  onClick={async () => {
                                    await deleteMessage(activeChatId, msg.id, true);
                                    setDeleteMessagePrompt(null);
                                  }}
                                  className="text-xs text-left px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-red-600"
                                >
                                  Delete for everyone
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        <div className={'px-4 py-2.5 rounded-2xl ' + (isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-sm')}>
                          <p className="text-sm">{msg.text}</p>
                        </div>
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
                  disabled={isSending}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-gray-100 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isSending}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
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
