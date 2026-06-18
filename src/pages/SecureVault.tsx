import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Shield, Lock, Unlock, Eye, EyeOff, Save, Trash2, Key } from 'lucide-react';
import { format } from 'date-fns';

// Encryption Utilities for "Data-at-Rest" Application Layer Security
// (In a real system, the encryption key would be securely retrieved via a KMS or highly protected user salt.
//  For demonstration purposes, we use a constant derived from user UID or a password)

async function generateKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret.padStart(32, '0').substring(0, 32)),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('SecureVaultSalt'), // Constant salt block for deterministic key
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(text: string, secret: string): Promise<{ ciphertext: string, iv: string }> {
  const key = await generateKey(secret);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );
  
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

async function decryptData(encryptedBase64: string, ivBase64: string, secret: string): Promise<string> {
  try {
    const key = await generateKey(secret);
    const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
    const encryptedData = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    return '🔒 Decryption Failed. Invalid Key or Corrupted Data.';
  }
}

interface VaultItem {
  id: string;
  title: string;
  encryptedData: string;
  iv: string;
  createdAt: any;
}

export function SecureVault() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [title, setTitle] = useState('');
  const [secretText, setSecretText] = useState('');
  const [vaultPassword, setVaultPassword] = useState(''); // Simulated master key input
  const [unlocked, setUnlocked] = useState(false);
  const [decryptedItems, setDecryptedItems] = useState<Record<string, string>>({});
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Data-in-Process: Firestore NoSQL SDK natively acts as Parameterized Statements
  // No execution of raw strings, fully immune to injection attacks.
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Using typed query conditions instead of raw DB querying ("Clean Room" logic)
    const q = query(
      collection(db, 'vault_secrets'),
      where('userId', '==', auth.currentUser.uid)
    );

    // Data-in-Transit: onSnapshot fetches over TLS/gRPC via secure Firebase socket.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: VaultItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        docs.push({
          id: doc.id,
          title: data.title,
          encryptedData: data.encryptedData,
          iv: data.iv,
          createdAt: data.createdAt
        });
      });
      // Sort client side for simplicity here (avoid index requirements natively)
      setItems(docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    });

    return () => unsubscribe();
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultPassword.trim()) return;
    setUnlocked(true);
  };

  const decryptItem = async (item: VaultItem) => {
    if (revealedIds.has(item.id)) {
      setRevealedIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      return;
    }

    const decryptedText = await decryptData(item.encryptedData, item.iv, vaultPassword);
    setDecryptedItems(prev => ({ ...prev, [item.id]: decryptedText }));
    setRevealedIds(prev => new Set(prev).add(item.id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !secretText.trim() || !auth.currentUser) return;

    // Client-side Application-level "At-Rest" encryption
    const { ciphertext, iv } = await encryptData(secretText, vaultPassword);

    await addDoc(collection(db, 'vault_secrets'), {
      title,
      encryptedData: ciphertext,
      iv: iv,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });

    setTitle('');
    setSecretText('');
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'vault_secrets', id));
  };

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-red-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">Secure Vault</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
            Access The Fortress Database Challenge component. Data is locally encrypted (AES-256-GCM) before being securely transported (TLS).
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input
                type="password"
                placeholder="Enter Master Vault Password"
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-zinc-100"
                value={vaultPassword}
                onChange={(e) => setVaultPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Unlock Database
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 animate-in fade-in duration-500 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center shrink-0">
             <Shield className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
           </div>
           <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">The Fortress Vault (Example)</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">End-to-End Encrypted Data Storage</p>
           </div>
        </div>
        <button 
          onClick={() => { setUnlocked(false); setVaultPassword(''); }}
          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors font-medium text-sm flex items-center gap-2"
        >
          <Lock className="w-4 h-4" />
          Lock Vault
        </button>
      </header>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* ADD SECURE NOTE */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm sticky top-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Store Sensitive Data</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g., Bank Routing Info"
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-zinc-100"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Secret Content</label>
              <textarea
                placeholder="Data placed here is encrypted before leaving your browser."
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-zinc-100 h-32 resize-none"
                value={secretText}
                onChange={e => setSecretText(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={!title.trim() || !secretText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Encrypt & Store
            </button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-500 space-y-2">
            <p><strong>At-Rest:</strong> Data transforms to AES-256 ciphertext.</p>
            <p><strong>In-Transit:</strong> TLS guarantees secure tunnel over HTTPS.</p>
            <p><strong>In-Process:</strong> SDK maps properties securely, preventing arbitrary injection attacks natively.</p>
          </div>
        </div>

        {/* VAULT ITEMS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Vault Items</h2>
          {items.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800/50 rounded-3xl">
              <Shield className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">Vault is currently empty.</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {item.createdAt ? format(item.createdAt.toDate(), "MMM d, yyyy h:mm a") : 'Just now'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decryptItem(item)}
                      className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
                    >
                      {revealedIds.has(item.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 overflow-x-auto">
                  {revealedIds.has(item.id) ? (
                    <div className="text-zinc-900 dark:text-zinc-100 font-mono text-sm whitespace-pre-wrap">
                      {decryptedItems[item.id]}
                    </div>
                  ) : (
                    <div className="select-all opacity-60 font-mono text-xs break-all text-zinc-500 tracking-tighter">
                      {item.encryptedData}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
