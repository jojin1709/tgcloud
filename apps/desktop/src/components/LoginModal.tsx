import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginModal: React.FC = () => {
  const { authState, sendCode, verifyCode, submitPassword } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSendPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setLocalError(null);
    try {
      await sendCode(phone.trim());
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to request login code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setLocalError(null);
    try {
      await verifyCode(code.trim());
    } catch (err: any) {
      setLocalError(err?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setLocalError(null);
    try {
      await submitPassword(password.trim());
    } catch (err: any) {
      setLocalError(err?.message || 'Invalid Two-Step Verification password');
    } finally {
      setLoading(false);
    }
  };

  const errorMsg = localError || authState.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tg-dark-bg select-none">
      <div className="relative w-full max-w-md bg-tg-dark-surface border border-tg-dark-border rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center">
        {/* Brand Icon */}
        <img src="/logo.png" alt="TGCloud Logo" className="w-16 h-16 rounded-2xl shadow-xl shadow-tg-blue-500/25 mb-5 object-cover" />

        <h1 className="text-2xl font-bold text-white tracking-tight">TGCloud</h1>
        <p className="text-xs text-tg-dark-muted mt-1 max-w-xs">
          Your files. Your Telegram. Your cloud storage.
        </p>

        {errorMsg && (
          <div className="w-full mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Phone Input */}
        {authState.step === 'need_phone' && (
          <form onSubmit={handleSendPhone} className="w-full mt-6 space-y-4">
            <div className="text-left">
              <label className="text-xs font-semibold text-tg-dark-muted block mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-tg-dark-bg border border-tg-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-tg-dark-muted focus:outline-none focus:border-tg-blue-500 transition-colors font-mono"
                />
              </div>
              <p className="text-[11px] text-tg-dark-muted mt-1.5">
                Include country code (e.g. +1, +44, +91). Official Telegram MTProto auth.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-tg-blue-500/25 transition-all"
            >
              <span>{loading ? 'Sending code...' : 'Continue with Telegram'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Verification Code */}
        {authState.step === 'need_code' && (
          <form onSubmit={handleVerifyCode} className="w-full mt-6 space-y-4">
            <div className="text-left">
              <label className="text-xs font-semibold text-tg-dark-muted block mb-1.5">
                Enter Telegram Code
              </label>
              <input
                type="text"
                placeholder="12345"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
                className="w-full text-center tracking-widest text-lg font-mono bg-tg-dark-bg border border-tg-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-tg-blue-500"
              />
              <p className="text-[11px] text-tg-dark-muted mt-1.5 text-center">
                We sent a login code to your Telegram app on your other devices.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-tg-blue-500/25 transition-all"
            >
              <span>{loading ? 'Verifying...' : 'Verify Code'}</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 3: 2FA Password */}
        {authState.step === 'need_password' && (
          <form onSubmit={handleSubmitPassword} className="w-full mt-6 space-y-4">
            <div className="text-left">
              <label className="text-xs font-semibold text-tg-dark-muted block mb-1.5">
                Two-Step Verification Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your 2FA password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-tg-dark-bg border border-tg-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-tg-blue-500"
                />
              </div>
              <p className="text-[11px] text-tg-dark-muted mt-1.5">
                Your Telegram account has cloud password protection enabled.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-tg-blue-500 hover:bg-tg-blue-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-tg-blue-500/25 transition-all"
            >
              <span>{loading ? 'Unlocking...' : 'Unlock Vault'}</span>
              <KeyRound className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-tg-dark-border/60 w-full flex items-center justify-center gap-1.5 text-[11px] text-tg-dark-muted">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Direct End-to-End MTProto connection to Telegram</span>
        </div>
      </div>
    </div>
  );
};
