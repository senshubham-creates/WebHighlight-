import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { AppUser } from '../types.ts';
import { loginWithEmail, registerWithEmail, loginWithGoogle, logoutUser, saveStoredLocalUser } from '../utils/firebase.ts';
import { Mail, Lock, User as UserIcon, X, Check, Cloud, LogOut, Sparkles, RefreshCw, AlertCircle, Zap } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | AppUser | null;
  onSetUser: (user: AppUser | User | null) => void;
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedTime: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSetUser,
  onSyncNow,
  isSyncing,
  lastSyncedTime,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('senshubham1012@gmail.com');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('Shubham Sen');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);

  if (!isOpen) return null;

  // Instant 1-click login for seamless preview & profile testing
  const handleInstantLogin = () => {
    const profile: AppUser = {
      uid: 'user-' + (email.replace(/[^a-zA-Z0-9]/g, '') || 'shubham'),
      email: email.trim() || 'senshubham1012@gmail.com',
      displayName: displayName.trim() || 'Shubham Sen',
      isDemo: true,
    };
    saveStoredLocalUser(profile);
    onSetUser(profile);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      let resUser: User;
      if (mode === 'login') {
        resUser = await loginWithEmail(email, password);
      } else {
        resUser = await registerWithEmail(email, password, displayName);
      }
      onSetUser(resUser);
      onClose();
    } catch (err: any) {
      console.error('Auth error', err);
      if (err.code === 'auth/operation-not-allowed') {
        setErrorMessage(
          'Email/Password sign-in is disabled in your Firebase console for project "turing-fabric-03kqt". To enable it, visit Firebase Console > Authentication > Sign-in method > Email/Password. Alternatively, click "⚡ Instant 1-Click Sign In" above!'
        );
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Invalid email or password. If this is your first time, switch to "Create Account" or use Instant Sign In.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists. Switch to Sign In or use Instant Sign In.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password should be at least 6 characters.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please verify your details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      onSetUser(user);
      onClose();
    } catch (err: any) {
      console.error('Google auth error', err);
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage(
          'This preview web domain is not yet listed under Firebase Console > Authentication > Settings > Authorized domains. Click "⚡ Instant 1-Click Sign In" above to start using your profile immediately!'
        );
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Popup was blocked by your browser. Please allow popups or use "⚡ Instant 1-Click Sign In"!');
      } else {
        setErrorMessage(err.message || 'Google sign-in was cancelled or blocked.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    try {
      await onSyncNow();
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 2500);
    } catch (err: any) {
      setErrorMessage('Sync failed: ' + (err.message || 'Network error'));
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      onSetUser(null);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign out failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-black/10 overflow-hidden transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-amber-300 flex items-center justify-center text-sm font-black border border-black/10">
              M
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-neutral-900">
                {currentUser ? 'Your Markwise Profile' : 'Sign in to Markwise'}
              </h2>
              <p className="text-[11px] text-neutral-500">Sync bookmarks & highlights across devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 cursor-pointer"
            aria-label="Close auth modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Logged In View */}
        {currentUser ? (
          <div className="p-6 space-y-5">
            {/* User Profile Card */}
            <div className="p-4 rounded-2xl bg-neutral-50 border-2 border-neutral-200 flex items-center gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center font-black text-lg shrink-0 border-2 border-black">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email?.[0].toUpperCase() || 'S'}
              </div>
              <div className="truncate min-w-0">
                <span className="font-black text-sm text-neutral-900 block truncate">
                  {currentUser.displayName || 'Shubham Sen'}
                </span>
                <span className="text-xs text-neutral-500 block truncate font-mono">
                  {currentUser.email || 'senshubham1012@gmail.com'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-0.5">
                  <Check className="w-3 h-3" /> Profile Synced & Active
                </span>
              </div>
            </div>

            {/* Sync Status Section */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wider">
                  <Cloud className="w-4 h-4 text-amber-600" />
                  <span>Cloud Synchronization</span>
                </div>
                {lastSyncedTime && (
                  <span className="text-[10px] text-amber-800 font-mono font-medium">
                    {lastSyncedTime}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed mb-3">
                Your bookmarks, reading themes, and multi-color highlights are synced with your cloud vault.
              </p>
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing to Cloud...' : syncSuccessToast ? '✓ Synced Successfully!' : 'Sync Now'}</span>
              </button>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Sign In Form with Instant 1-Click & Fallbacks */
          <div className="p-6">
            {/* Fast 1-Click Sign-in Button */}
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  Instant 1-Click Access
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Recommended</span>
              </div>
              <p className="text-xs text-emerald-900 mb-2.5 leading-relaxed">
                Start syncing as <strong>Shubham Sen</strong> ({email}) without popup friction.
              </p>
              <button
                onClick={handleInstantLogin}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Continue as Shubham Sen</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Google Sign In */}
            <div className="mb-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 border-2 border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-bold text-neutral-800 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google Account</span>
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-neutral-400 font-bold">or email & password</span>
              </div>
            </div>

            {/* Toggle Login vs Register */}
            <div className="flex p-1 bg-neutral-100 rounded-xl mb-3 text-xs font-bold">
              <button
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  mode === 'login' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  mode === 'register' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Shubham Sen"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="senshubham1012@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-xs mt-1"
              >
                {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In with Email' : 'Create Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
