import React, { useState } from 'react';
import { authenticateUser, setCurrentUser } from '../services/storage';
import { apiAuth } from '../services/api';
import { User as UserType } from '../types';
import { LimbandoLogo } from '../components/LimbandoLogo';
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import schoolCampusBg from '../assets/images/school_campus_bg_1790269174650.jpg';

interface LoginProps {
  onLoginSuccess: (user: UserType) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError('Please enter your username or email address.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try server JWT authentication
      const { user } = await apiAuth.login(username, password);
      setCurrentUser(user);
      onLoginSuccess(user);
    } catch (apiErr: any) {
      console.warn('Server auth failed or offline, checking local credentials fallback:', apiErr.message);
      // 2. Fallback to local authentication if offline
      const result = authenticateUser(username, password);
      if (result.error) {
        setError(apiErr.message || result.error);
      } else if (result.user) {
        onLoginSuccess(result.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-center items-center p-3 sm:p-4 overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Campus Image with Soft Natural Blur Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={schoolCampusBg}
          alt="Limbando Private School Campus"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        {/* Soft atmospheric overlay */}
        <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[3px]" />
      </div>

      {/* Floating White Login Card - Resized to fit viewport smoothly & fully responsive */}
      <div className="relative z-10 w-full max-w-[340px] sm:max-w-[360px] bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] border border-white/90 px-6 py-5 sm:px-7 sm:py-6 text-center my-auto transition-all">
        {/* 1. School Crest Logo */}
        <div className="flex justify-center mb-1.5">
          <LimbandoLogo size={66} />
        </div>

        {/* 2. School Name Typography */}
        <div className="text-center">
          <h1 className="text-[18px] sm:text-[19px] font-black tracking-[0.14em] text-[#0C4A34] uppercase leading-tight">
            LIMBANDO
          </h1>
          <p className="text-[10.5px] sm:text-[11px] font-bold tracking-[0.24em] text-[#0C4A34] uppercase mt-0.5 leading-none">
            PRIVATE SCHOOL
          </p>
        </div>

        {/* 3. Section Heading */}
        <div className="mt-3.5 text-center">
          <h2 className="text-[16px] sm:text-[17px] font-bold text-[#111827] tracking-tight leading-snug">
            Student &amp; Staff Login
          </h2>
          <p className="text-[11px] sm:text-[11.5px] text-[#6B7280] mt-0.5 font-normal">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-3 p-2 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700 text-left animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
            <span className="text-[11px] leading-tight">{error}</span>
          </div>
        )}

        {/* Forgot password note */}
        {forgotMessage && (
          <div className="mt-3 p-2 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 text-left animate-in fade-in">
            <strong>Password Assistance:</strong> Please contact the school IT or admin office to reset credentials.
          </div>
        )}

        {/* 4. Credentials Form */}
        <form className="mt-3.5 space-y-2.5 text-left" onSubmit={handleSubmit}>
          {/* Username / Email field */}
          <div className="relative flex items-center bg-white border border-[#E2E8F0] rounded-xl sm:rounded-2xl px-3.5 py-2.5 shadow-2xs focus-within:border-[#0C4A34] focus-within:ring-2 focus-within:ring-[#0C4A34]/20 transition-all">
            <User className="w-4 h-4 text-[#0C4A34] shrink-0 mr-2.5" />
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username or Staff Email"
              className="w-full text-xs sm:text-sm text-[#1E293B] placeholder-[#94A3B8] font-normal focus:outline-none bg-transparent"
            />
          </div>

          {/* Password field */}
          <div className="relative flex items-center bg-white border border-[#E2E8F0] rounded-xl sm:rounded-2xl px-3.5 py-2.5 shadow-2xs focus-within:border-[#0C4A34] focus-within:ring-2 focus-within:ring-[#0C4A34]/20 transition-all">
            <Lock className="w-4 h-4 text-[#0C4A34] shrink-0 mr-2.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full text-xs sm:text-sm text-[#1E293B] placeholder-[#94A3B8] font-normal focus:outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#64748B] hover:text-[#0C4A34] transition-colors ml-1.5 focus:outline-none cursor-pointer p-0.5"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* 5. Sign In Pill Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-1 py-2.5 sm:py-3 px-5 rounded-full bg-[#0C4A34] hover:bg-[#083827] active:scale-[0.99] text-white font-bold text-sm sm:text-[15px] tracking-wide flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* 6. Forgot your password link */}
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => setForgotMessage(!forgotMessage)}
            className="inline-flex items-center justify-center gap-1 text-[11px] sm:text-xs font-semibold text-[#0C4A34] hover:underline cursor-pointer"
          >
            <Lock className="w-3 h-3 text-[#0C4A34]" />
            <span>Forgot your password?</span>
          </button>
        </div>

        {/* 7. Divider Line */}
        <hr className="border-t border-[#F1F5F9] my-3.5" />

        {/* 8. Footer Brand & Motto */}
        <div className="text-center">
          <div className="text-[10px] sm:text-[10.5px] font-extrabold text-[#0C4A34] uppercase tracking-wider">
            LIMBANDO PRIVATE SCHOOL
          </div>
          <div className="text-[10px] sm:text-[10.5px] text-[#475569] font-medium mt-0.5">
            Knowledge &nbsp;•&nbsp; Discipline &nbsp;•&nbsp; Success
          </div>
        </div>
      </div>
    </div>
  );
};
