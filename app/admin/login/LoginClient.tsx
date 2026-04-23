'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import CloudspaceHeader from '../../components/CloudspaceHeader';
import LucideIcon from '@/components/LucideIcon';

export default function LoginClient() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const params = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Get raw callbackUrl and extract only the path part if it's a full URL
  const rawCallbackUrl = params.get('callbackUrl') || '/admin';
  let callbackUrl = '/admin';
  try {
    if (rawCallbackUrl.startsWith('http')) {
      callbackUrl = new URL(rawCallbackUrl).pathname;
    } else {
      callbackUrl = rawCallbackUrl;
    }
  } catch (e) {
    callbackUrl = '/admin';
  }

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="text-white/60 text-sm font-bold uppercase tracking-widest animate-pulse">Verifying Session…</div>
      </div>
    );
  }

  // If already authenticated, show a simple redirecting message while the useEffect runs
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="text-white/60 text-sm font-bold uppercase tracking-widest">Loading…</div>
      </div>
    );
  }

  async function handleSignIn() {
    if (!username || !password) return;
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setAuthError('Invalid credentials. Please try again.');
        setIsAuthenticating(false);
      } else {
        router.replace(callbackUrl);
      }
    } catch (error) {
      setAuthError('An error occurred. Please try again.');
      setIsAuthenticating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#000]">
      <CloudspaceHeader buttonLabel="Login" buttonHref="/admin/login" />
      <div className="flex items-center justify-center p-4 min-h-screen pt-6">
        <div className="w-full max-w-md bg-[#000]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-6 md:p-7">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4">
              <Image
                src="/CloudSpace_Logo.png"
                alt="Logo"
                width={28}
                height={28}
                className="w-10 h-10"
              />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1.5">
              CNT <span className="text-[#ed1c24]">CloudSpace</span>
            </h2>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-[0.15em] max-w-xs leading-relaxed">
              Secure access to CNT CloudSpace Portal
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 ml-1">
                Username
              </label>
              <div className="relative group">
                <LucideIcon name="user" className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-[#ed1c24] transition-colors" />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isAuthenticating}
                  className="w-full pl-11 pr-6 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/10 focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all duration-300 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 ml-1">
                Password
              </label>
              <div className="relative group">
                <LucideIcon name="key" className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-[#ed1c24] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAuthenticating}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSignIn();
                  }}
                  className="w-full pl-11 pr-24 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/10 focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all duration-300 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-bold uppercase tracking-widest text-[#ed1c24] hover:text-white transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2.5 text-rose-400 text-[9px] bg-rose-400/5 border border-rose-400/20 p-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <LucideIcon name="alert-circle" className="w-3.5 h-3.5 shrink-0" />
                <p className="font-bold uppercase tracking-widest">{authError}</p>
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={isAuthenticating || !username || !password}
              className="group w-full py-3 bg-[#ed1c24] text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-red-800 transition-all duration-300 shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center gap-3">
                {isAuthenticating ? (
                  <>
                    <LucideIcon name="loader-2" className="w-4 h-4 animate-spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    Sign In to Portal
                    <LucideIcon name="arrow-right" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
