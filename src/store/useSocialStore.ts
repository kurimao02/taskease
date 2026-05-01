import { create } from 'zustand';
import { db } from '../firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, arrayUnion, arrayRemove, query, where, onSnapshot, orderBy 
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
    const snapshot = await new Promise<any>((resolve) => {
      const unsub = onSnapshot(q, (snap) => {
        unsub();
        resolve(snap);
      });
    });

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
    const snapshot = await new Promise<any>((resolve) => {
      const unsub = onSnapshot(q, (snap) => {
        unsub();
        resolve(snap);
      });
    });

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

  startChat: async (withEmail) => {
    const { currentUserProfile, chats } = get();
    if (!currentUserProfile) return '';

    // Check if chat exists
    const existingChat = chats.find(c => c.participants.includes(withEmail));
    if (existingChat) return existingChat.id;

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
      }
    } catch (e: any) {
      console.warn("getDoc failed, proceeding with setDoc merge", e);
      await setDoc(chatRef, {
        id: chatId,
        participants,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
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
      createdAt: new Date().toISOString()
    });

    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      updatedAt: new Date().toISOString()
    });
  }
}));
