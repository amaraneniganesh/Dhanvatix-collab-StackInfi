import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  MapPin, 
  Globe, 
  MonitorSmartphone,
  ChevronDown,
  ChevronUp,
  Activity,
  LogOut,
  Mail,
  Lock,
  Search,
  AlertCircle,
  LayoutDashboard,
  List,
  User,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminPortal() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [users, setUsers] = useState<any[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainRecords, setDomainRecords] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        localStorage.setItem('adminToken', data.token);
      } else {
        setErrorMsg(data.message || 'Invalid credentials');
      }
    } catch (e) {
      setErrorMsg('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiFetch(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        // If unauthorized, token might be invalid
        if (res.status === 401 || res.status === 403) {
          handleLogout();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateLimit = async (userId: string, newLimit: number) => {
    try {
      const res = await apiFetch(`${API_URL}/admin/users/${userId}/limit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ limit: newLimit })
      });
      if (res.ok) {
        alert('Domain limit updated successfully');
        fetchUsers();
      } else {
        alert('Failed to update limit');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBlockUser = async (userId: string, currentStatus: string) => {
    const action = currentStatus === 'suspended' ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      const res = await apiFetch(`${API_URL}/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert(`Failed to ${action} user`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecords = async (domainId: string) => {
    // toggle off if already fetched
    if (domainRecords[domainId]) {
      const newRecords = { ...domainRecords };
      delete newRecords[domainId];
      setDomainRecords(newRecords);
      return;
    }

    try {
      const res = await apiFetch(`${API_URL}/admin/domains/${domainId}/records`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDomainRecords(prev => ({ ...prev, [domainId]: data.records }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="bg-[#121214] border border-white/5 p-10 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
          <div className="text-center mb-8">
            <div className="mx-auto bg-red-500/10 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <ShieldCheck size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Gateway</h1>
            <p className="text-sm text-slate-500 mt-2">Restricted access portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                placeholder="Admin Email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
              />
            </div>

            {errorMsg && (
              <div className="text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center">
                {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] mt-4 disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-300 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#121214] border-r border-white/5 flex flex-col hidden md:flex fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#09090b]">
          <div className="w-6 h-6 rounded-md bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)] mr-3"></div>
          <span className="font-bold text-lg text-white tracking-wide">Dhanvatix</span>
        </div>
        
        <div className="p-4 flex-1 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 mt-4 px-2">Menu</div>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-white hover:bg-white/5`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-white hover:bg-white/5`}
          >
            <Globe className="w-4 h-4" /> Claim Domain
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex justify-between text-slate-400 hover:text-white hover:bg-white/5`}
          >
            <div className="flex items-center gap-3"><List className="w-4 h-4" /> My Domains</div>
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-white hover:bg-white/5`}
          >
            <User className="w-4 h-4" /> Profile
          </button>

          <div className="text-xs font-semibold text-red-500/70 uppercase tracking-widest mb-4 mt-8 px-2 pt-4 border-t border-white/5">Admin</div>
          <button 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          >
            <ShieldAlert className="w-4 h-4" /> Admin Portal
          </button>
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => {
              handleLogout();
              localStorage.removeItem('userId');
              localStorage.removeItem('sessionExpiresAt');
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 relative min-h-screen flex flex-col">
        {/* Admin Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#121214] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-red-500" size={24} />
          <h1 className="text-lg font-bold text-white tracking-wide">Dhanvatix <span className="text-red-500">Admin</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold border border-red-500/20 flex items-center gap-2">
            <Activity size={14} /> System Online
          </span>
          <button 
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">User Registry & KYC</h2>
            <p className="text-slate-500">Monitor registered users, their security data, and active domains.</p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-[#121214] border border-white/5 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#121214] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="text-slate-500 text-sm font-bold mb-2 uppercase tracking-widest">Total Users</div>
            <div className="text-4xl font-bold text-white">{users.length}</div>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full"></div>
            <Users className="absolute top-6 right-6 text-slate-700 opacity-30" size={32} />
          </div>
          <div className="bg-[#121214] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="text-slate-500 text-sm font-bold mb-2 uppercase tracking-widest">Total Domains</div>
            <div className="text-4xl font-bold text-white">
              {users.reduce((acc, u) => acc + (u.domains?.length || 0), 0)}
            </div>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full"></div>
            <Globe className="absolute top-6 right-6 text-slate-700 opacity-30" size={32} />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#121214] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-slate-500 text-[11px] uppercase tracking-widest border-b border-white/5">
                  <th className="p-4 pl-6 font-bold w-12"></th>
                  <th className="p-4 font-bold">User</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">Domains</th>
                  <th className="p-4 font-bold">Joined</th>
                  <th className="p-4 pr-6 font-bold text-right">KYC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => {
                    const isExpanded = expandedUserId === u._id;
                    const hasKyc = !!u.lastIp;
                    
                    return (
                      <React.Fragment key={u._id}>
                        <tr 
                          onClick={() => setExpandedUserId(isExpanded ? null : u._id)}
                          className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                        >
                          <td className="p-4 pl-6 text-slate-600">
                            {isExpanded ? <ChevronUp size={18} className="text-red-400" /> : <ChevronDown size={18} className="group-hover:text-white transition-colors" />}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
                                {u.profilePicture ? (
                                  <img src={u.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 bg-slate-800 uppercase">
                                    {u.name?.charAt(0) || u.username?.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-white font-bold text-sm flex items-center gap-2">
                                  {u.name}
                                  {u.status === 'suspended' && <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">Blocked</span>}
                                </div>
                                <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-sm text-slate-400">{u.email}</td>
                          <td className="p-4">
                            <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/20">
                              {u.domains?.length || 0}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-sm text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {hasKyc ? (
                              <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-bold bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                                <ShieldCheck size={14} /> Logged
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                                <AlertCircle size={14} /> Pending
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded Pane */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="p-0 border-b border-white/5 bg-black/20">
                              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                
                                {/* KYC SECURITY CARD */}
                                <div className="bg-[#09090b] p-6 rounded-2xl border border-white/5 shadow-inner">
                                  <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                      <ShieldCheck className="text-red-500" size={18} />
                                      Security & KYC Data
                                    </h4>
                                    <button 
                                      onClick={() => toggleBlockUser(u._id, u.status)}
                                      className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${u.status === 'suspended' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'}`}
                                    >
                                      {u.status === 'suspended' ? 'Unblock User' : 'Block User'}
                                    </button>
                                  </div>
                                  
                                  {hasKyc ? (
                                    <div className="space-y-6">
                                      <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 mt-1 border border-blue-500/20">
                                          <MapPin size={20} />
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Last IP & Location</div>
                                          <div className="text-white font-mono text-sm mb-1">{u.lastIp}</div>
                                          {u.location?.city ? (
                                            <div className="text-slate-400 text-sm flex flex-col gap-1">
                                              <div className="flex items-center gap-2">
                                                {u.location.city}, {u.location.country}
                                                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono">
                                                  {u.location.lat}, {u.location.lon}
                                                </span>
                                              </div>
                                              <a href={`https://www.google.com/maps?q=${u.location.lat},${u.location.lon}`} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:text-teal-400 text-xs font-bold w-fit flex items-center gap-1 mt-1">
                                                <MapPin size={12} /> Open in Maps
                                              </a>
                                            </div>
                                          ) : (
                                            <div className="text-slate-500 text-sm">Location unresolved</div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-400 mt-1 border border-orange-500/20">
                                          <MonitorSmartphone size={20} />
                                        </div>
                                        <div>
                                          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Device Signature</div>
                                          <div className="text-slate-300 text-sm leading-relaxed break-words">{u.deviceInfo}</div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                                      <AlertCircle size={32} className="mb-3 opacity-50" />
                                      <p className="text-sm font-medium">No KYC data logged yet.</p>
                                      <p className="text-xs mt-1">User must log in to capture data.</p>
                                    </div>
                                  )}
                                </div>

                                {/* DOMAINS CARD */}
                                <div className="bg-[#09090b] p-6 rounded-2xl border border-white/5 shadow-inner">
                                  <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                      <Globe className="text-purple-400" size={18} />
                                      Claimed Domains ({u.domains?.length || 0})
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-500 font-bold uppercase">Limit:</span>
                                      <input type="number" min="0" className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs outline-none" defaultValue={u.domainLimit !== undefined ? u.domainLimit : 2} id={`limit-${u._id}`} />
                                      <button onClick={() => updateLimit(u._id, parseInt((document.getElementById(`limit-${u._id}`) as HTMLInputElement).value))} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs px-3 py-1 rounded font-bold transition-colors">Save</button>
                                    </div>
                                  </div>
                                  
                                  {u.domains && u.domains.length > 0 ? (
                                    <div className="space-y-3">
                                      {u.domains.map((d: any) => (
                                        <div key={d._id} className="bg-[#121214] border border-white/5 rounded-xl p-4">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <div className="text-white font-bold text-sm">{d.fullDomain}</div>
                                              <div className="text-xs text-slate-500 mt-1">Claimed {new Date(d.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              {d.status === 'Verified' ? (
                                                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" title="Verified"></span>
                                              ) : (
                                                <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]" title="Pending"></span>
                                              )}
                                              <button onClick={() => fetchRecords(d._id)} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition-colors border border-slate-700">Records</button>
                                            </div>
                                          </div>
                                          {domainRecords[d._id] && (
                                            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                              {domainRecords[d._id].length === 0 ? (
                                                <div className="text-xs text-slate-500">No records found.</div>
                                              ) : (
                                                domainRecords[d._id].map(r => (
                                                  <div key={r.id} className="text-xs flex flex-col gap-1 text-slate-400 bg-black/20 p-2 rounded border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                      <span className="bg-teal-500/10 text-teal-400 px-1.5 py-0.5 rounded font-bold w-12 text-center">{r.type}</span>
                                                      <span className="flex-1 font-mono truncate text-white">{r.name}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                      <span className="text-slate-500 font-mono truncate pr-4">{r.content}</span>
                                                      <div className="flex gap-2 items-center text-[10px] shrink-0">
                                                        {r.proxied ? <span className="text-orange-400 border border-orange-500/20 bg-orange-500/10 px-1.5 rounded">Proxied</span> : <span className="text-slate-500 border border-white/5 bg-black/40 px-1.5 rounded">DNS Only</span>}
                                                        <span className="bg-slate-800 px-1.5 rounded text-slate-400 border border-slate-700">TTL: {r.ttl === 1 ? 'Auto' : r.ttl}</span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                      <Globe size={32} className="mb-3 opacity-50" />
                                      <p className="text-sm font-medium">No domains claimed.</p>
                                    </div>
                                  )}
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
