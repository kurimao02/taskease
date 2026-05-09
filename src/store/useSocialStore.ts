import { create } from 'zustand';
import { db } from '../firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, arrayUnion, arrayRemove, query, where, onSnapshot, orderBy, getDocs, limit 
} from 'firebase/firestore';
import { UserProfile, Chat, ChatMessage } from '../types';

interface SocialStore {
  currentUserProfile: UserProfile | null;
  setCurrentUserProfile: (profile: UserProfile | null) => void;
  
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  
  messages: Record<string, ChatMessage[]>;
  setMessages: (chatId: string, messages: ChatMessage[]) => void;

  initializeUserProfile: (user: any) => Promise<void>;
  sendFriendRequest: (toEmail: string) => Promise<void>;
  acceptFriendRequest: (fromEmail: string) => Promise<void>;
  rejectFriendRequest: (fromEmail: string) => Promise<void>;
  
  startChat: (withEmail: string) => Promise<string>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string, forEveryone: boolean) => Promise<void>;
  deleteChat: (chatId: string, forEveryone: boolean) => Promise<void>;
  setTyping: (chatId: string, isTyping: boolean) => Promise<void>;
  removeFriend: (friendEmail: string) => Promise<void>;
  markChatAsRead: (chatId: string) => Promise<void>;
}

export const useSocialStore = create<SocialStore>((set, get) => ({
  currentUserProfile: null,
  setCurrentUserProfile: (profile) => set({ currentUserProfile: profile }),
  
  chats: [],
  setChats: (chats) => set({ chats }),
  
  messages: {},
  setMessages: (chatId, messages) => set((state) => ({ 
    messages: { ...state.messages, [chatId]: messages } 
  })),

  initializeUserProfile: async (user) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        friends: [],
        friendRequests: []
      });
    }
  },

  sendFriendRequest: async (toEmail) => {
    const { currentUserProfile } = get();
    if (!currentUserProfile || currentUserProfile.email === toEmail) return;

    // We need to query for the user with this email to update their friendRequests.
    const q = query(collection(db, 'users'), where('email', '==', toEmail));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const toUserDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'users', toUserDoc.id), {
        friendRequests: arrayUnion(currentUserProfile.email)
      });
    } else {
      alert("User not found!");
    }
  },

  acceptFriendRequest: async (fromEmail) => {
    const { currentUserProfile } = get();
    if (!currentUserProfile) return;

    // Query for the other user to add us to their friends
    const q = query(collection(db, 'users'), where('email', '==', fromEmail));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const fromUserDoc = snapshot.docs[0];
      
      // Add to both friends lists, remove from our requests
      await updateDoc(doc(db, 'users', currentUserProfile.id), {
        friendRequests: arrayRemove(fromEmail),
        friends: arrayUnion(fromEmail)
      });

      await updateDoc(doc(db, 'users', fromUserDoc.id), {
        friends: arrayUnion(currentUserProfile.email)
      });
    }
  },

  rejectFriendRequest: async (fromEmail) => {
    const { currentUserProfile } = get();
    if (!currentUserProfile) return;

    await updateDoc(doc(db, 'users', currentUserProfile.id), {
      friendRequests: arrayRemove(fromEmail)
    });
  },

  removeFriend: async (friendEmail) => {
    const { currentUserProfile } = get();
    if (!currentUserProfile) return;

    try {
      await updateDoc(doc(db, 'users', currentUserProfile.id), {
        friends: arrayRemove(friendEmail)
      });
      
      const q = query(collection(db, 'users'), where('email', '==', friendEmail), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          friends: arrayRemove(currentUserProfile.email)
        });
      }
    } catch (e) {
      console.error("Failed to remove friend", e);
    }
  },

  markChatAsRead: async (chatId) => {
    const { currentUserProfile } = get();
    if (!currentUserProfile) return;
    
    try {
      const msgsRef = collection(db, 'chats', chatId, 'messages');
      const q = query(msgsRef, orderBy('createdAt', 'desc'), limit(20));
      const snap = await getDocs(q);
      
      const updatePromises: Promise<void>[] = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.senderEmail !== currentUserProfile.email && !data.readBy?.includes(currentUserProfile.email)) {
          updatePromises.push(updateDoc(d.ref, {
            readBy: arrayUnion(currentUserProfile.email)
          }).catch(() => {}));
        }
      });
      
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    } catch (e) {
      console.warn("markChatAsRead failed:", e);
    }
  },

  startChat: async (withEmail) => {
    const { currentUserProfile, chats } = get();
    if (!currentUserProfile) return '';

    // Check if chat exists locally
    const existingChat = chats.find(c => c.participants.includes(withEmail));
    if (existingChat) {
      return existingChat.id;
    }

    // Create a new chat
    const participants = [currentUserProfile.email, withEmail].sort();
    const chatId = ('chat_' + participants[0] + '_' + participants[1]).replace(/[^a-zA-Z0-9]/g, '_');
    
    // Check again in DB just in case
    const chatRef = doc(db, 'chats', chatId);
    try {
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          id: chatId,
          participants,
          updatedAt: new Date().toISOString(),
          lastMessage: ''
        });
      } else {
        const data = chatSnap.data();
        if (data.deletedFor?.includes(currentUserProfile.email)) {
          await updateDoc(chatRef, {
            deletedFor: arrayRemove(currentUserProfile.email)
          });
        }
      }
    } catch (e: any) {
      console.warn("getDoc failed, proceeding with setDoc merge", e);
      await setDoc(chatRef, {
        id: chatId,
        participants,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      await updateDoc(chatRef, {
        deletedFor: arrayRemove(currentUserProfile.email)
      }).catch(() => {});
    }

    return chatId;
  },

  sendMessage: async (chatId, text) => {
    const { currentUserProfile } = get();
    if (!currentUserProfile || !text.trim()) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      text,
      senderEmail: currentUserProfile.email,
      createdAt: new Date().toISOString(),
      readBy: [currentUserProfile.email]
    });

    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      updatedAt: new Date().toISOString(),
      deletedFor: [],
      typing: arrayRemove(currentUserProfile.email)
    });
  },

  setTyping: async (chatId, isTyping) => {
    const { currentUserProfile } = get();
    if (!currentUserProfile) return;

    try {
      await updateDoc(doc(db, 'chats', chatId), {
        typing: isTyping ? arrayUnion(currentUserProfile.email) : arrayRemove(currentUserProfile.email)
      });
    } catch (e) {
      console.warn("setTyping failed:", e);
    }
  },

  deleteMessage: async (chatId, messageId, forEveryone) => {
    const { currentUserProfile, chats } = get();
    if (!currentUserProfile) return;

    try {
      if (forEveryone) {
        try {
          await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
        } catch (e) {
          console.warn('Failed to delete message, using soft delete fallback', e);
          const currentChat = chats.find(c => c.id === chatId);
          if (currentChat) {
            await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
              deletedFor: currentChat.participants || []
            });
          }
        }
      } else {
        await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
          deletedFor: arrayUnion(currentUserProfile.email)
        });
      }
    } catch (e) {
      console.error("Error deleting message:", e);
    }
  },

  deleteChat: async (chatId, forEveryone) => {
    const { currentUserProfile } = get();
    if (!currentUserProfile) return;

    try {
      const msgsRef = collection(db, 'chats', chatId, 'messages');
      const snap = await getDocs(msgsRef);
      
      if (forEveryone) {
        try {
          const deletePromises = snap.docs.map(d => deleteDoc(d.ref).catch(e => console.error(e)));
          await Promise.all(deletePromises);
        } catch (e) {
          console.warn('Failed to delete subcollection messages', e);
        }
        
        try {
          await deleteDoc(doc(db, 'chats', chatId));
        } catch (e) {
          console.warn('Failed to delete chat doc', e);
        }
      } else {
        try {
          const updatePromises = snap.docs.map(d => updateDoc(d.ref, {
            deletedFor: arrayUnion(currentUserProfile.email)
          }).catch(e => console.error(e)));
          await Promise.all(updatePromises);
        } catch (e) {
          console.warn('Failed to soft delete subcollection messages', e);
        }

        await updateDoc(doc(db, 'chats', chatId), {
          deletedFor: arrayUnion(currentUserProfile.email)
        });
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat. Check console for details.");
    }
  }
}));
