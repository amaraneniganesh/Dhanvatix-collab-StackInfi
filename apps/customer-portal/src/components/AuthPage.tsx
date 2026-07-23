import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, KeyRound, Sparkles, UserPlus, Fingerprint, Mail } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AuthPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'login' | 'register' | 'otp' | 'forgot-password'>('login');
  
  // Registration fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP state
  const [otp, setOtp] = useState('');
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const saveSession = (id: string) => {
    localStorage.setItem('userId', id);
    // 7 days or 24 hours
    const expiryDays = rememberMe ? 7 : 1;
    const expiresAt = new Date().getTime() + (expiryDays * 24 * 60 * 60 * 1000);
    localStorage.setItem('sessionExpiresAt', expiresAt.toString());
    navigate('/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    try {
      const res = await apiFetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          username, 
          firstName, 
          lastName, 
          phoneNumber 
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.requiresOtp) {
          setTempUserId(data.userId);
          setView('otp');
        } else {
          saveSession(data.userId);
        }
      } else {
        setErrorMsg(data.message || 'Registration failed');
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    try {
      const res = await apiFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, deviceId: getDeviceId() })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.requiresOtp) {
          setTempUserId(data.userId);
          setView('otp');
        } else {
          saveSession(data.userId);
        }
      } else {
        setErrorMsg(data.message || 'Login failed');
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    try {
      const res = await apiFetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId, otp, deviceId: getDeviceId(), rememberMe })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        saveSession(data.userId);
      } else {
        setErrorMsg(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotPasswordSuccess(false);
    setLoading(true);
    
    try {
      const res = await apiFetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setForgotPasswordSuccess(true);
      } else {
        setErrorMsg(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const googleAuthStub = () => {
    setErrorMsg('Google Auth is coming soon!');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/10 blur-[120px]"></div>
        <div className="absolute top-[40%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[150px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="w-full max-w-[1100px] flex flex-col md:flex-row bg-[#18181b]/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 min-h-[500px] md:min-h-[700px]">
        
        {/* Left Side - Image/Branding Panel */}
        <div className="w-full md:w-5/12 bg-[#09090b] relative p-10 flex flex-col justify-between hidden md:flex border-r border-white/5 overflow-hidden">
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-teal-400 hover:text-teal-300 transition-colors uppercase bg-teal-400/10 px-4 py-2 rounded-full border border-teal-400/20">
              <ChevronLeft className="w-4 h-4" />
              StackInfi Home
            </Link>
          </div>

          <div className="relative z-10 my-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(45,212,191,0.3)]">
              {view === 'login' ? <KeyRound className="w-8 h-8 text-white" /> : view === 'register' ? <UserPlus className="w-8 h-8 text-white" /> : view === 'forgot-password' ? <Mail className="w-8 h-8 text-white" /> : <Fingerprint className="w-8 h-8 text-white" />}
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
              {view === 'login' ? 'Welcome Back' : view === 'register' ? 'Join StackInfi & Dhanvatix' : view === 'forgot-password' ? 'Reset Password' : 'Verify Identity'}
            </h1>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-[250px] mx-auto">
              {view === 'login' 
                ? 'Sign in to manage your domains and DNS configurations.' 
                : view === 'register' 
                  ? 'Create an account to claim your premium StackInfi & Dhanvatix domains.'
                  : view === 'forgot-password'
                    ? 'Enter your email address and we will send you a secure link to reset your password.'
                  : 'Enter the security code sent to your email to verify your identity.'}
            </p>
          </div>

          {/* Premium graphic element */}
          <div className="relative z-10 w-full h-32 rounded-2xl border border-white/5 bg-gradient-to-t from-white/5 to-transparent overflow-hidden flex items-end">
             <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full stroke-teal-500/20 fill-none" strokeWidth="0.5">
                <path d="M0 25 C 20 25, 20 15, 40 15 C 60 15, 60 5, 80 5 C 90 5, 95 10, 100 10" />
                <path d="M0 28 C 30 28, 30 18, 50 18 C 70 18, 70 8, 90 8 C 95 8, 98 12, 100 12" stroke="rgba(59,130,246,0.3)" />
              </svg>
          </div>
        </div>

        {/* Right Side - Forms */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 md:p-14 flex flex-col justify-center">
          
          {/* Mobile top nav */}
          <div className="flex items-center justify-between mb-6 md:hidden">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors uppercase bg-teal-400/10 px-3 py-1.5 rounded-full border border-teal-400/20">
              <ChevronLeft className="w-3 h-3" />
              Home
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-teal-400 to-blue-500"></div>
              <span className="text-sm font-bold text-white">StackInfi</span>
            </div>
          </div>
          
          {errorMsg && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
              {errorMsg}
            </div>
          )}

          {view === 'otp' ? (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700 ease-out max-w-md w-full mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-3">Security Code</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We've sent a 6-digit code to your email.
                </p>
              </div>
              
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    className="w-full p-4 text-center tracking-[1em] text-3xl rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all font-mono"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading || otp.length < 6}
                  className="w-full bg-white text-black hover:bg-slate-200 py-4 rounded-xl font-bold text-[15px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50 mt-4"
                >
                  {loading ? 'Verifying...' : 'Authenticate'}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setView('login')}
                  className="w-full text-slate-500 text-sm hover:text-white font-medium transition-colors pt-4"
                >
                  Return to login
                </button>
              </form>
            </div>
          ) : view === 'forgot-password' ? (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700 ease-out max-w-md w-full mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-3">Forgot Password</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Enter your email to receive a password reset link.
                </p>
              </div>
              
              {forgotPasswordSuccess ? (
                <div className="p-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center mb-8">
                  <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-teal-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Check your email</h3>
                  <p className="text-slate-400 text-sm">
                    We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      className="w-full p-4 rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading || !email}
                    className="w-full bg-white text-black hover:bg-slate-200 py-4 rounded-xl font-bold text-[15px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50 mt-4"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
              
              <button 
                type="button" 
                onClick={() => { setView('login'); setForgotPasswordSuccess(false); setErrorMsg(''); }}
                className="w-full text-slate-500 text-sm hover:text-white font-medium transition-colors pt-6"
              >
                Return to login
              </button>
            </div>
          ) : view === 'login' ? (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700 ease-out max-w-md w-full mx-auto">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold text-white mb-3">Sign In</h2>
                <p className="text-slate-400 text-sm">
                  Don't have an account? <button onClick={() => { setView('register'); setErrorMsg(''); }} className="text-teal-400 hover:text-teal-300 font-bold transition-colors underline decoration-teal-400/30 underline-offset-4">Create one</button>
                </p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full p-4 rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full p-4 rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-2 mt-2 ml-1">
                  <input 
                    type="checkbox" 
                    id="rememberMe"
                    className="w-4 h-4 rounded border-white/10 bg-black/40 text-teal-500 focus:ring-teal-500"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="rememberMe" className="text-sm font-medium text-slate-400 cursor-pointer">
                    Remember me for 7 days
                  </label>
                </div>
                
                <div className="flex justify-end -mt-2">
                  <button type="button" onClick={() => { setView('forgot-password'); setErrorMsg(''); }} className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
                
                <button  
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-slate-200 py-4 rounded-xl font-bold text-[15px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50 mt-8"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
              
              <div className="mt-8 relative flex items-center justify-center">
                <div className="border-t border-white/10 w-full"></div>
                <span className="bg-[#18181b] px-4 text-[10px] font-bold text-slate-500 tracking-widest uppercase absolute">Or Continue With</span>
              </div>
              
              <button 
                type="button" 
                onClick={googleAuthStub}
                className="w-full mt-8 bg-black/40 border border-white/10 hover:border-white/20 hover:bg-black/60 text-white py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-3"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                Google Account
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold text-white mb-3">Create Account</h2>
                <p className="text-slate-400 text-sm">
                  Already a member? <button onClick={() => { setView('login'); setErrorMsg(''); }} className="text-teal-400 hover:text-teal-300 font-bold transition-colors underline decoration-teal-400/30 underline-offset-4">Sign in here</button>
                </p>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">First name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-3.5 rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">Last name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-3.5 rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-3.5 rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase())}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone</label>
                    <input 
                      type="tel" 
                      placeholder="+91..."
                      className="w-full p-3.5 rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    className="w-full p-3.5 rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full p-3.5 rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <p className="text-[11px] font-medium text-slate-500 mt-2 flex items-center gap-1.5 ml-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    Require 8+ chars, upper, lower, number, and symbol.
                  </p>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-slate-200 py-4 rounded-xl font-bold text-[15px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50 mt-6"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
