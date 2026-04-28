import React from 'react';
import { signInWithGoogle } from '../firebase';
import { CheckSquare, ArrowRight } from 'lucide-react';

export function Login() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Subtle modern background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md z-10 flex flex-col items-center">
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white shadow-2xl backdrop-blur-md">
            <CheckSquare size={28} className="text-white" strokeWidth={2} />
          </div>
        </div>
        <h2 className="text-center text-4xl font-bold tracking-tight text-white mb-3">
          TaskEase
        </h2>
        <p className="text-center text-base text-zinc-400 max-w-sm">
          A beautifully simple space to manage your academic life, sync tasks, and collaborate.
        </p>
      </div>

      <div className="relative mt-12 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-zinc-900/50 backdrop-blur-xl py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border border-zinc-800/50">
          <div className="space-y-6">
            <button
              onClick={signInWithGoogle}
              className="group w-full flex items-center justify-between py-3.5 px-6 border border-zinc-700/50 rounded-xl shadow-sm text-sm font-medium text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </div>
              <ArrowRight size={18} className="text-zinc-500 group-hover:text-white transition-colors group-hover:translate-x-0.5" />
            </button>
            <div className="text-center text-xs text-zinc-500 pt-2">
              By continuing, you are setting up a secure academic task workspace.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
