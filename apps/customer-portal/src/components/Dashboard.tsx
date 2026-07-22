import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiFetch } from '../utils/apiClient';
import { 
  LayoutDashboard, 
  Globe, 
  List, 
  User, 
  LogOut, 
  ChevronRight,
  ShieldAlert,
  Camera,
  CheckCircle2,
  Clock,
  Trash2,
  Menu,
  X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [activeTab, setActiveTab] = useState<'overview' | 'claim' | 'list' | 'profile'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Domain State
  const [subdomain, setSubdomain] = useState('');
  const [rootDomain, setRootDomain] = useState('dhanvatix.in');
  const [domains, setDomains] = useState<any[]>([]);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  
  // Profile State
  const [profile, setProfile] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password Reset State
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'idle' | 'otp_sent' | 'done'>('idle');
  const [profileMsg, setProfileMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const expiresAt = localStorage.getItem('sessionExpiresAt');
    if (!userId || !expiresAt || new Date().getTime() > parseInt(expiresAt)) {
      handleLogout();
    } else {
      fetchDomains();
      fetchProfile();
    }
    
    // Check every minute
    const interval = setInterval(() => {
      const expiresAt = localStorage.getItem('sessionExpiresAt');
      if (!userId || !expiresAt || new Date().getTime() > parseInt(expiresAt)) {
        handleLogout();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [userId, navigate]);

  const fetchDomains = async () => {
    try {
      const res = await apiFetch(`${API_URL}/domains?userId=${userId}`);
      const data = await res.json();
      setDomains(data.domains || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await apiFetch(`${API_URL}/users/profile?userId=${userId}`);
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setEditFirstName(data.user.firstName || '');
        setEditLastName(data.user.lastName || '');
        setEditPhone(data.user.phoneNumber || '');
        setAvatarBase64(data.user.profilePicture || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkDomain = async () => {
    const res = await apiFetch(`${API_URL}/domains/check?subdomain=${subdomain}&rootDomain=${rootDomain}`);
    const data = await res.json();
    setSearchResult(data.message);
  };

  const claimDomain = async () => {
    const res = await apiFetch(`${API_URL}/domains/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain, rootDomain, userId })
    });
    const data = await res.json();
    if (res.ok) {
      toast.success('Domain claimed successfully!');
      setSubdomain('');
      setSearchResult(null);
      fetchDomains();
      setActiveTab('list');
    } else {
      toast.error(data.message);
    }
  };

  const manageDNS = async (domainId?: string) => {
    const res = await apiFetch(`${API_URL}/bridge/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (res.ok) {
      const data = await res.json();
      let url = data.bridgeUrl;
      if (domainId) {
        url += `&domainId=${domainId}`;
      }
      window.location.href = url;
    } else {
      toast.error('Failed to generate bridge token');
    }
  };

  const deleteDomain = async (domainId: string) => {
    toast('Are you sure you want to delete this domain?', {
      description: 'All associated DNS records will also be deleted. This cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const res = await apiFetch(`${API_URL}/domains/${domainId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId })
            });
            const data = await res.json();
            
            if (res.ok) {
              toast.success('Domain deleted successfully!');
              fetchDomains();
            } else {
              toast.error(data.message || 'Failed to delete domain');
            }
          } catch (e) {
            console.error(e);
            toast.error('Network error occurred while deleting domain');
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionExpiresAt');
    setUserId(null);
    navigate('/login');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Image must be less than 10MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsSaving(true);
    try {
      const res = await apiFetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          firstName: editFirstName,
          lastName: editLastName,
          phoneNumber: editPhone,
          profilePicture: avatarBase64
        })
      });
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully' });
        fetchProfile();
      } else {
        setProfileMsg({ type: 'error', text: 'Failed to update profile' });
      }
    } catch (e) {
      setProfileMsg({ type: 'error', text: 'Network error' });
    } finally {
      setIsSaving(false);
    }
  };

  const requestPasswordReset = async () => {
    setProfileMsg(null);
    try {
      const res = await apiFetch(`${API_URL}/auth/request-password-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setResetStep('otp_sent');
        setProfileMsg({ type: 'success', text: 'OTP sent to your email' });
      } else {
        setProfileMsg({ type: 'error', text: 'Failed to send OTP' });
      }
    } catch (e) {
      setProfileMsg({ type: 'error', text: 'Network error' });
    }
  };

  const confirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      const res = await apiFetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp: resetOtp, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setResetStep('done');
        setResetOtp('');
        setNewPassword('');
        setProfileMsg({ type: 'success', text: 'Password updated successfully!' });
        setTimeout(() => setResetStep('idle'), 3000);
      } else {
        setProfileMsg({ type: 'error', text: data.message || 'Failed to reset password' });
      }
    } catch (e) {
      setProfileMsg({ type: 'error', text: 'Network error' });
    }
  };

  if (!userId || !profile) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const dhanvatixCount = domains.filter(d => d.rootDomain === 'dhanvatix.in').length;
  const stackinfiCount = domains.filter(d => d.rootDomain === 'stackinfi.in').length;
  const totalCount = domains.length;

  const totalLimit = profile.domainLimit !== undefined ? profile.domainLimit : 4;
  const isInfinite = totalLimit === 0;
  const dhanvatixMax = isInfinite ? Infinity : Math.ceil(totalLimit / 2);
  const stackinfiMax = isInfinite ? Infinity : Math.floor(totalLimit / 2);

  const displayTotalLimit = isInfinite ? '∞' : totalLimit;
  const displayDhanvatixMax = isInfinite ? '∞' : dhanvatixMax;
  const displayStackinfiMax = isInfinite ? '∞' : stackinfiMax;

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-300 font-sans flex">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-[#121214] border-r border-white/5 flex flex-col fixed h-full z-40 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#09090b]">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-md bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)] mr-3"></div>
            <span className="font-bold text-lg text-white tracking-wide">StackInfi</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 mt-4 px-2">Menu</div>
          
          <button 
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          
          <button 
            onClick={() => { setActiveTab('claim'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'claim' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Globe className="w-4 h-4" /> Claim Domain
          </button>
          
          <button 
            onClick={() => { setActiveTab('list'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex justify-between ${activeTab === 'list' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3"><List className="w-4 h-4" /> My Domains</div>
            <span className="bg-slate-800 text-xs py-0.5 px-2 rounded-full">{totalCount}</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
          
          {profile?.role === 'admin' && (
            <>
              <div className="text-xs font-semibold text-red-500/70 uppercase tracking-widest mb-4 mt-8 px-2 pt-4 border-t border-white/5">Admin</div>
              <button 
                onClick={() => navigate('/admin')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              >
                <ShieldAlert className="w-4 h-4" /> Admin Portal
              </button>
            </>
          )}
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative min-h-screen">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-400 hover:text-white p-1">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-white capitalize hidden sm:block">
              {activeTab === 'overview' ? 'Dashboard Overview' : 
               activeTab === 'claim' ? 'Claim a New Domain' : 
               activeTab === 'list' ? 'My Domains' : 'User Profile'}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => manageDNS()} 
              className="bg-teal-500 hover:bg-teal-400 text-black px-3 md:px-4 py-1.5 rounded-full font-bold transition-all text-xs md:text-sm shadow-[0_0_15px_rgba(20,184,166,0.3)] flex items-center gap-1 md:gap-2 whitespace-nowrap"
            >
              Manage DNS <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden cursor-pointer hover:border-teal-500 transition-colors" onClick={() => setActiveTab('profile')}>
              {profile?.profilePicture ? (
                <img src={profile.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-1.5 text-slate-400" />
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-5xl mx-auto">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#121214] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                  <div className="text-slate-400 text-sm font-medium mb-1">Total Claimed</div>
                  <div className="text-4xl font-bold text-white">{totalCount} <span className="text-lg text-slate-500 font-normal">/ {displayTotalLimit}</span></div>
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-teal-500/5 blur-2xl rounded-full"></div>
                </div>
                <div className="bg-[#121214] p-6 rounded-2xl border border-white/5">
                  <div className="text-slate-400 text-sm font-medium mb-1">Dhanvatix.in</div>
                  <div className="text-4xl font-bold text-white">{dhanvatixCount} <span className="text-lg text-slate-500 font-normal">/ {displayDhanvatixMax}</span></div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: isInfinite ? '100%' : `${(dhanvatixCount / dhanvatixMax) * 100}%` }}></div>
                  </div>
                </div>
                <div className="bg-[#121214] p-6 rounded-2xl border border-white/5">
                  <div className="text-slate-400 text-sm font-medium mb-1">StackInfi.in</div>
                  <div className="text-4xl font-bold text-white">{stackinfiCount} <span className="text-lg text-slate-500 font-normal">/ {displayStackinfiMax}</span></div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: isInfinite ? '100%' : `${(stackinfiCount / stackinfiMax) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-[#121214] border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Welcome back, {profile.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  You are currently using {totalCount} out of your {isInfinite ? 'unlimited' : displayTotalLimit} allowed free subdomains. 
                  Remember that you can claim up to {displayDhanvatixMax} domains for .dhanvatix.in and {displayStackinfiMax} for .stackinfi.in.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button onClick={() => setActiveTab('claim')} className="bg-white text-black px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-200 transition-colors text-sm w-full sm:w-auto">
                    Claim New Domain
                  </button>
                  <button onClick={() => setActiveTab('list')} className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-700 transition-colors border border-slate-700 text-sm w-full sm:w-auto">
                    View My Domains
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CLAIM TAB */}
          {activeTab === 'claim' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#121214] p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden max-w-2xl mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none"></div>
                
                <h2 className="text-2xl font-bold mb-6 text-white relative z-10">
                  Provision a New Subdomain
                </h2>
                
                <div className="space-y-6 relative z-10">
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Select Root Zone</label>
                    <select 
                      className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all appearance-none"
                      value={rootDomain}
                      onChange={e => setRootDomain(e.target.value)}
                    >
                      <option value="dhanvatix.in">.dhanvatix.in ({dhanvatixCount}/{displayDhanvatixMax} claimed)</option>
                      <option value="stackinfi.in">.stackinfi.in ({stackinfiCount}/{displayStackinfiMax} claimed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Subdomain Name</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="your-app" 
                        className="flex-1 p-3.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                        value={subdomain} 
                        onChange={e => setSubdomain(e.target.value.toLowerCase())} 
                      />
                      <div className="flex items-center px-4 bg-slate-900 rounded-xl text-slate-400 font-mono font-medium border border-white/5">
                        .{rootDomain}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button 
                      onClick={checkDomain} 
                      className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3.5 rounded-xl transition-colors font-medium border border-slate-700 text-sm w-full sm:w-auto"
                    >
                      Check Availability
                    </button>
                    <button 
                      onClick={claimDomain} 
                      disabled={
                        !isInfinite && (
                          (rootDomain === 'dhanvatix.in' && dhanvatixCount >= dhanvatixMax) || 
                          (rootDomain === 'stackinfi.in' && stackinfiCount >= stackinfiMax)
                        )
                      }
                      className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3.5 rounded-xl transition-all flex-1 font-bold shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:shadow-none w-full sm:w-auto"
                    >
                      Claim Domain
                    </button>
                  </div>
                  
                  {searchResult && (
                    <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-sm font-medium text-white flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${searchResult.includes('available') ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                      {searchResult}
                    </div>
                  )}
                  
                  {!isInfinite && ((rootDomain === 'dhanvatix.in' && dhanvatixCount >= dhanvatixMax) || (rootDomain === 'stackinfi.in' && stackinfiCount >= stackinfiMax)) && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex gap-3">
                      <ShieldAlert className="w-5 h-5 shrink-0" />
                      You have reached the maximum limit of {rootDomain === 'dhanvatix.in' ? displayDhanvatixMax : displayStackinfiMax} domains for this root zone.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LIST TAB */}
          {activeTab === 'list' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#121214] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Your Domains</h3>
                </div>
                
                {domains.length === 0 ? (
                  <div className="text-center p-12">
                    <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No domains claimed yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                      <tr className="bg-[#09090b] text-xs uppercase tracking-widest text-slate-500 font-semibold">
                        <th className="p-4 pl-6 font-semibold">Domain Name</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Verification Code</th>
                        <th className="p-4 font-semibold">Created</th>
                        <th className="p-4 font-semibold text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {domains.map(d => (
                        <tr key={d._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 pl-6 font-mono text-white text-sm font-medium">
                            {d.fullDomain}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-md font-medium border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {d.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <code className="text-xs bg-[#09090b] text-slate-400 px-2 py-1 rounded border border-white/5">
                              {d.verificationCode}
                            </code>
                          </td>
                          <td className="p-4 text-sm text-slate-500 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-right pr-6 flex justify-end gap-2">
                            <button 
                              onClick={() => manageDNS(d._id)} 
                              className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 px-3 py-1.5 rounded text-xs font-bold transition-colors border border-teal-500/20"
                            >
                              Manage DNS
                            </button>
                            <button 
                              onClick={() => deleteDomain(d._id)} 
                              className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded"
                              title="Delete Domain"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto space-y-8">
              
              {profileMsg && (
                <div className={`p-4 rounded-xl border text-sm font-medium ${profileMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {profileMsg.text}
                </div>
              )}

              <div className="bg-[#121214] p-8 rounded-2xl border border-white/5 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6">Profile Details</h2>
                
                <form onSubmit={saveProfile} className="space-y-6">
                  
                  {/* Avatar Upload */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                    <div 
                      className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-teal-500 transition-colors shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatarBase64 ? (
                        <img src={avatarBase64} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-500 group-hover:text-teal-400 transition-colors" />
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Edit</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center sm:items-start">
                      <h3 className="text-white font-medium mb-1">Profile Picture</h3>
                      <p className="text-xs text-slate-500 mb-3">Max size: 10MB. Recommended 256x256px.</p>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp"
                      />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition border border-slate-700">Upload Image</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">First Name</label>
                      <input type="text" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-teal-500 transition-all" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Last Name</label>
                      <input type="text" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-teal-500 transition-all" value={editLastName} onChange={e => setEditLastName(e.target.value)} required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                      <input type="text" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-teal-500 transition-all" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        Username <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-400">Read-only</span>
                      </label>
                      <input type="text" className="w-full p-3 rounded-xl bg-[#09090b] border border-white/5 text-slate-500 cursor-not-allowed font-mono" value={profile.username} disabled />
                    </div>
                  </div>

                  <button type="submit" disabled={isSaving} className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    {isSaving ? 'Uploading...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Password Management */}
              <div className="bg-[#121214] p-8 rounded-2xl border border-red-500/10 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" /> Security
                </h2>
                <p className="text-sm text-slate-400 mb-6">Changing your password requires email verification.</p>
                
                {resetStep === 'idle' ? (
                  <button onClick={requestPasswordReset} className="bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-3 rounded-xl font-bold hover:bg-red-500/20 transition-colors text-sm">
                    Change Password
                  </button>
                ) : resetStep === 'otp_sent' ? (
                  <form onSubmit={confirmPasswordReset} className="space-y-4 animate-in fade-in bg-black/20 p-6 rounded-xl border border-white/5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">6-Digit Code</label>
                      <input type="text" placeholder="• • • • • •" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-red-500 transition-all font-mono tracking-[0.5em] text-center" value={resetOtp} onChange={e => setResetOtp(e.target.value.replace(/\D/g, ''))} maxLength={6} required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                      <input type="password" placeholder="New Password" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-red-500 transition-all" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setResetStep('idle')} className="px-6 py-3 rounded-xl text-slate-400 hover:text-white transition-colors text-sm font-medium">Cancel</button>
                      <button type="submit" disabled={resetOtp.length < 6 || !newPassword} className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-colors text-sm disabled:opacity-50">
                        Confirm Reset
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-green-500/10 text-green-400 p-4 rounded-xl border border-green-500/20 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5" /> Password successfully updated!
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
