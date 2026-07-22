import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import DNSManager from './components/DNSManager';
import { 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  LayoutDashboard, 
  User, 
  LogOut, 
  ChevronRight,
  Globe,
  Menu,
  X
} from 'lucide-react';
import { apiFetch } from './utils/apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MAIN_PORTAL_URL = import.meta.env.VITE_MAIN_PORTAL_URL || 'http://localhost:3000';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('dnsToken'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [isConsuming, setIsConsuming] = useState(false);
  const [domains, setDomains] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const consumeAttempted = useRef(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'whois'>('overview');
  const [selectedDomain, setSelectedDomain] = useState<any | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Whois State
  const [whoisQuery, setWhoisQuery] = useState('');
  const [whoisResult, setWhoisResult] = useState<any | null>(null);
  const [isWhoisLoading, setIsWhoisLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const bridgeToken = urlParams.get('token');
    const targetDomainId = urlParams.get('domainId');

    if (targetDomainId) {
      localStorage.setItem('targetDomainId', targetDomainId);
    }

    if (bridgeToken && !consumeAttempted.current) {
      consumeAttempted.current = true;
      setIsConsuming(true);
      consumeBridgeToken(bridgeToken);
    } else if (token && userId) {
      fetchDomains();
      fetchProfile();
    }
  }, []);

  const consumeBridgeToken = async (bridgeToken: string) => {
    try {
      const res = await apiFetch(`${API_URL}/bridge/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: bridgeToken })
      });
      
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUserId(data.userId);
        localStorage.setItem('dnsToken', data.token);
        localStorage.setItem('userId', data.userId);
        
        window.history.replaceState({}, document.title, "/");
        fetchDomains(data.userId);
        fetchProfile(data.userId);
      } else {
        toast.error('Invalid or expired bridge token. Please login from the StackInfi portal.');
        window.location.href = `${MAIN_PORTAL_URL}/login`;
      }
    } catch (e) {
      toast.error('Error consuming bridge token');
    } finally {
      setIsConsuming(false);
    }
  };

  const fetchDomains = async (id = userId) => {
    if (!id) return;
    const res = await apiFetch(`${API_URL}/domains?userId=${id}`);
    const data = await res.json();
    const fetchedDomains = data.domains || [];
    setDomains(fetchedDomains);
    
    const targetId = localStorage.getItem('targetDomainId');
    if (targetId) {
      const target = fetchedDomains.find((d: any) => d._id === targetId);
      if (target) {
        setSelectedDomain(target);
      }
      localStorage.removeItem('targetDomainId');
    }
  };

  const fetchProfile = async (id = userId) => {
    if (!id) return;
    try {
      const res = await apiFetch(`${API_URL}/users/profile?userId=${id}`);
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWhoisLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whoisQuery) return;
    
    setIsWhoisLoading(true);
    setWhoisResult(null);
    try {
      const res = await apiFetch(`${API_URL}/dns/whois?domain=${whoisQuery}`);
      const data = await res.json();
      setWhoisResult(data);
    } catch (e) {
      console.error(e);
      setWhoisResult({ error: 'Failed to fetch WHOIS data' });
    } finally {
      setIsWhoisLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserId(null);
    localStorage.clear();
    window.location.href = `${MAIN_PORTAL_URL}/login`;
  };

  if (isConsuming) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl text-purple-400 font-semibold tracking-wide">Authenticating Secure Bridge...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
        <div className="bg-[#121214] border border-white/5 p-10 rounded-2xl text-center max-w-md w-full shadow-2xl">
          <div className="mx-auto bg-slate-900 w-16 h-16 flex items-center justify-center rounded-full mb-6 border border-white/10 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <ShieldCheck size={32} className="text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-white">StackInfi & Dhanvatix <span className="text-purple-400">DNS</span></h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Direct login is disabled for security. You must authenticate via the StackInfi portal bridge.
          </p>
          <a href={`${MAIN_PORTAL_URL}/dashboard`} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg block font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            Return to StackInfi Dashboard
          </a>
        </div>
      </div>
    );
  }

  const verifiedDomains = domains.filter(d => d.status === 'Verified');
  const pendingDomains = domains.filter(d => d.status !== 'Verified');

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
            <div className="w-6 h-6 rounded-md bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] mr-3"></div>
            <span className="font-bold text-base text-white tracking-wide">DNS Portal</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 mt-4 px-2">Menu</div>
          
          <button 
            onClick={() => { setActiveTab('overview'); setSelectedDomain(null); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' && !selectedDomain ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          
          <button 
            onClick={() => { setActiveTab('whois'); setSelectedDomain(null); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'whois' ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Search className="w-4 h-4" /> WHOIS Lookup
          </button>
        </div>

        <div className="p-4 border-t border-white/5 space-y-2">
          <a 
            href={`${MAIN_PORTAL_URL}/dashboard`}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            <ChevronRight className="w-4 h-4" /> Main Dashboard
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> End Session
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
            <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
              {selectedDomain ? (
                <>
                  <button onClick={() => setSelectedDomain(null)} className="text-slate-400 hover:text-white transition-colors hidden sm:block">
                    Overview
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />
                  <span className="text-purple-400 truncate max-w-[160px] sm:max-w-none">{selectedDomain.fullDomain}</span>
                </>
              ) : activeTab === 'overview' ? 'DNS Overview' : 'WHOIS Lookup'}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="bg-green-500/10 text-green-400 px-2 sm:px-3 py-1.5 rounded-full text-xs font-bold border border-green-500/20 hidden sm:flex items-center gap-2">
              <ShieldCheck size={14} /> Secure Bridge
            </span>
            <div className="flex items-center gap-2 sm:gap-3 border-l border-white/10 pl-3 sm:pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-white leading-tight">{profile?.name || 'Loading...'}</div>
                <div className="text-xs text-slate-500 font-mono">{profile?.username || ''}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                {profile?.profilePicture ? (
                  <img src={profile.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-2 text-slate-400" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
          
          {selectedDomain ? (
            <DNSManager 
              domainId={selectedDomain._id} 
              rootDomain={selectedDomain.fullDomain}
              onBack={() => setSelectedDomain(null)}
            />
          ) : activeTab === 'overview' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#121214] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                  <div className="text-slate-400 text-sm font-medium mb-1">Total Domains</div>
                  <div className="text-4xl font-bold text-white">{domains.length}</div>
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full"></div>
                </div>
                <div className="bg-[#121214] p-6 rounded-2xl border border-white/5">
                  <div className="text-slate-400 text-sm font-medium mb-1">Active / Verified</div>
                  <div className="text-4xl font-bold text-green-400">{verifiedDomains.length}</div>
                </div>
                <div className="bg-[#121214] p-6 rounded-2xl border border-white/5">
                  <div className="text-slate-400 text-sm font-medium mb-1">Pending Verification</div>
                  <div className="text-4xl font-bold text-yellow-500">{pendingDomains.length}</div>
                </div>
              </div>

              {/* Verified Domains List */}
              <div className="bg-[#121214] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <h3 className="text-lg font-bold text-white">Verified Domains</h3>
                  <p className="text-sm text-slate-400 mt-1">Select a domain to manage its DNS records.</p>
                </div>
                
                {verifiedDomains.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="w-12 h-12 mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-400 font-medium">No verified domains yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {verifiedDomains.map(d => (
                      <div 
                        key={d._id} 
                        onClick={() => setSelectedDomain(d)}
                        className="p-6 hover:bg-white/[0.02] transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <Globe size={20} />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{d.fullDomain}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                              <span className="text-xs text-slate-400 font-medium">Routing Active</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                            Manage Records
                          </span>
                          <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Pending Domains Notice */}
              {pendingDomains.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl flex items-start gap-4">
                  <AlertCircle className="text-yellow-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-yellow-500 font-bold mb-1">Pending Verifications ({pendingDomains.length})</h4>
                    <p className="text-sm text-slate-400">You have domains waiting for verification. Return to the main dashboard to view the verification codes and complete setup.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* WHOIS TAB */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
              <div className="bg-[#121214] p-8 rounded-2xl border border-white/5 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-2">WHOIS Lookup</h2>
                <p className="text-slate-400 text-sm mb-6">Instantly query domain registration and nameserver details.</p>
                
                <form onSubmit={handleWhoisLookup} className="flex flex-col sm:flex-row gap-3 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g. dhanvatix.in" 
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                      value={whoisQuery} 
                      onChange={e => setWhoisQuery(e.target.value.toLowerCase())} 
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isWhoisLoading}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] disabled:opacity-50 whitespace-nowrap"
                  >
                    {isWhoisLoading ? 'Querying...' : 'Lookup'}
                  </button>
                </form>

                {whoisResult && (
                  <div className="bg-[#09090b] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <Globe className="text-purple-400" size={18} />
                        WHOIS Data for <span className="text-purple-400">{whoisQuery}</span>
                      </h3>
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold bg-black/40 px-3 py-1 rounded-full border border-white/5">
                        Live Query
                      </span>
                    </div>
                    
                    <div className="p-6">
                      {whoisResult.error ? (
                        <div className="text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20 flex items-center gap-3">
                          <AlertCircle />
                          {whoisResult.error}
                        </div>
                      ) : whoisResult.domain ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Domain Info */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Domain Information</h4>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-slate-500">Domain Name</span>
                              <span className="text-white font-bold">{whoisResult.domain.domain || whoisQuery}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-slate-500">Creation Date</span>
                              <span className="text-slate-300 font-mono text-sm">{whoisResult.domain.created_date ? new Date(whoisResult.domain.created_date).toLocaleString() : 'N/A'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-slate-500">Expiration Date</span>
                              <span className="text-slate-300 font-mono text-sm">{whoisResult.domain.expiration_date ? new Date(whoisResult.domain.expiration_date).toLocaleString() : 'N/A'}</span>
                            </div>
                          </div>
                          
                          {/* Registrar & Nameservers */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Registrar Details</h4>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-slate-500">Registrar Name</span>
                              <span className="text-white font-bold">{whoisResult.registrar?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex flex-col gap-1 mt-4">
                              <span className="text-xs text-slate-500 mb-1">Nameservers</span>
                              <div className="flex flex-col gap-1.5">
                                {whoisResult.domain.name_servers && whoisResult.domain.name_servers.length > 0 ? (
                                  whoisResult.domain.name_servers.map((ns: string, i: number) => (
                                    <div key={i} className="bg-slate-800 border border-white/5 px-3 py-1.5 rounded-lg text-slate-300 font-mono text-xs w-fit">
                                      {ns.toLowerCase()}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-slate-500 text-sm">No nameservers found</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 overflow-x-auto">
                          <pre className="text-xs text-purple-300/80 font-mono leading-relaxed">
                            {JSON.stringify(whoisResult, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
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

export default App;
