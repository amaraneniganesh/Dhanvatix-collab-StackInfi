import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, Sparkles, ChevronLeft } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    
    try {
      const res = await apiFetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
      } else {
        setErrorMsg(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/10 blur-[120px]"></div>
        <div className="absolute top-[40%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[150px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="w-full max-w-[1100px] flex flex-col md:flex-row bg-[#18181b]/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 min-h-[700px]">
        
        {/* Left Side - Image/Branding Panel */}
        <div className="w-full md:w-5/12 bg-[#09090b] relative p-10 flex flex-col justify-between hidden md:flex border-r border-white/5 overflow-hidden">
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-teal-400 hover:text-teal-300 transition-colors uppercase bg-teal-400/10 px-4 py-2 rounded-full border border-teal-400/20">
              <ChevronLeft className="w-4 h-4" />
              Return Home
            </Link>
          </div>

          <div className="relative z-10 my-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(45,212,191,0.3)]">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
              Create New Password
            </h1>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-[250px] mx-auto">
              Please enter your new password to regain access to your Dhanvatix account.
            </p>
          </div>

          <div className="relative z-10 w-full h-32 rounded-2xl border border-white/5 bg-gradient-to-t from-white/5 to-transparent overflow-hidden flex items-end">
             <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full stroke-teal-500/20 fill-none" strokeWidth="0.5">
                <path d="M0 25 C 20 25, 20 15, 40 15 C 60 15, 60 5, 80 5 C 90 5, 95 10, 100 10" />
                <path d="M0 28 C 30 28, 30 18, 50 18 C 70 18, 70 8, 90 8 C 95 8, 98 12, 100 12" stroke="rgba(59,130,246,0.3)" />
              </svg>
          </div>
        </div>

        {/* Right Side - Forms */}
        <div className="w-full md:w-7/12 p-8 md:p-14 flex flex-col justify-center">
          
          {errorMsg && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
              {errorMsg}
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-right-8 duration-700 ease-out max-w-md w-full mx-auto">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-white mb-3">Reset Password</h2>
              <p className="text-slate-400 text-sm">
                Enter your new password below.
              </p>
            </div>
            
            {success ? (
              <div className="text-center">
                <div className="p-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-8">
                  <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-6 h-6 text-teal-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Password Reset Successful</h3>
                  <p className="text-slate-400 text-sm">
                    Your password has been successfully updated. You can now login with your new password.
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full bg-white text-black hover:bg-slate-200 py-4 rounded-xl font-bold text-[15px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  Proceed to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full p-4 rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <p className="text-[11px] font-medium text-slate-500 mt-2 flex items-center gap-1.5 ml-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    Require 8+ chars, upper, lower, number, and symbol.
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full p-4 rounded-xl border border-white/10 bg-black/40 text-white focus:border-teal-500 focus:bg-black/60 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                
                <button  
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-slate-200 py-4 rounded-xl font-bold text-[15px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50 mt-8"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            )}
            
            {!success && (
              <div className="mt-8 text-center">
                <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-white transition-colors">
                  Cancel and return to login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
