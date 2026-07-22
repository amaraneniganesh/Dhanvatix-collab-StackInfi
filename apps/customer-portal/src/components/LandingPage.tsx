import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Globe,
  ShieldCheck,
  Zap,
  ChevronRight,
  Sparkles,
  Server,
  Fingerprint,
  Users,
  Hash,
  ArrowRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Stats {
  totalUsers: number;
  totalDomains: number;
  dhanvatixDomains: number;
  stackinfiDomains: number;
}

export default function LandingPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats/public`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error('Failed to fetch stats');
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans selection:bg-teal-500/30">

      {/* Navbar */}
      <nav className="fixed top-0 w-full border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]"></div>
            <span className="font-bold text-lg text-white tracking-wide">StackInfi & Dhanvatix</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link to="/login" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-slate-200 transition-colors flex items-center gap-1.5">
              Get Started <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[85vh] flex flex-col items-center justify-center text-center">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-teal-300 mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Introducing StackInfi & Dhanvatix Subdomains</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
            Unleash the power of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
              intuitive domain control
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mb-10 leading-relaxed">
            Say goodbye to outdated domain registrars. Build your digital infrastructure with premium domains like <strong className="text-white">.stackinfi.in</strong> and <strong className="text-white">.dhanvatix.in</strong>. Smart, intuitive. And never boring.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/login" className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2">
              Claim your domain <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="#features" className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all">
              Explore features
            </Link>
          </div>
        </div>

        {/* Abstract App UI Mockup */}
        <div className="relative z-10 w-full max-w-5xl mt-20 rounded-2xl border border-white/10 bg-[#18181b]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            </div>
            <div className="mx-auto w-80 h-6 rounded bg-black/50 border border-white/5 flex items-center justify-center px-3">
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">dashboard.stackinfi.in</span>
            </div>
          </div>
          <div className="p-8 grid md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Active Domain</div>
                  <div className="text-2xl font-mono text-white">app.stackinfi.in</div>
                </div>
                <div className="px-3 py-1 bg-teal-500/10 text-teal-400 rounded border border-teal-500/20 text-xs">Active</div>
              </div>
              <div className="h-48 bg-gradient-to-t from-teal-500/5 to-transparent border border-white/5 rounded-xl relative overflow-hidden flex items-end">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-3/4 stroke-teal-500/50 fill-none" strokeWidth="0.5">
                  <path d="M0 25 C 20 25, 20 15, 40 15 C 60 15, 60 5, 80 5 C 90 5, 95 10, 100 10" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-black/40 p-5 rounded-xl border border-white/5 h-full">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-4">DNS Records</div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <span className="text-slate-300 font-mono">A</span>
                      <span className="text-slate-500 font-mono">192.168.1.{i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      {stats && (
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 backdrop-blur-sm text-xs font-medium text-teal-300 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
              Live Platform Stats
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Trusted by a growing community
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 text-center hover:bg-[#1f1f22] transition-colors group">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">{stats.totalUsers}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total Users</div>
            </div>

            <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 text-center hover:bg-[#1f1f22] transition-colors group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">{stats.totalDomains}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Domains Claimed</div>
            </div>

            <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 text-center hover:bg-[#1f1f22] transition-colors group">
              <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-teal-500/20 group-hover:scale-110 transition-transform">
                <Hash className="w-6 h-6 text-teal-400" />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">{stats.stackinfiDomains}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">StackInfi Domains</div>
            </div>

            <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 text-center hover:bg-[#1f1f22] transition-colors group">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <Hash className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">{stats.dhanvatixDomains}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Dhanvatix Domains</div>
            </div>
          </div>
        </section>
      )}

      {/* Features Heading */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Everything you need.<br />Nothing you don't.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Domain management shouldn't be a massive puzzle. StackInfi & Dhanvatix is a flexible toolkit that makes every digital infrastructure task feel like a breeze.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-8 hover:bg-[#1f1f22] transition-colors group">
            <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-6 border border-teal-500/20 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Custom Subdomains</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Claim your unique identity on the web instantly. Grab <code className="text-teal-400 bg-teal-400/10 px-1 py-0.5 rounded">.stackinfi.in</code> or <code className="text-teal-400 bg-teal-400/10 px-1 py-0.5 rounded">.dhanvatix.in</code> before anyone else does.
            </p>
          </div>

          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-8 hover:bg-[#1f1f22] transition-colors group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Server className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Advanced DNS Management</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Full control over your records. Add A, CNAME, TXT, and MX records seamlessly backed by Cloudflare's global edge network.
            </p>
          </div>

          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-8 hover:bg-[#1f1f22] transition-colors group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Instant Free SSL</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Security shouldn't be an add-on. Every StackInfi & Dhanvatix domain is automatically provisioned with a free, auto-renewing SSL certificate.
            </p>
          </div>

          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-8 hover:bg-[#1f1f22] transition-colors group">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Lightning Fast Provisioning</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              No waiting for DNS propagation. Claim your domain and start routing traffic to your application within seconds.
            </p>
          </div>

          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-8 hover:bg-[#1f1f22] transition-colors group">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6 border border-pink-500/20 group-hover:scale-110 transition-transform">
              <Fingerprint className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Secure Identity Auth</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Rest easy knowing your domain assets are locked down with rigorous password policies and mandatory OTP email verification.
            </p>
          </div>

          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-8 hover:bg-[#1f1f22] transition-colors group">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Insightful Dashboard</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Manage everything from one unified control plane. View statuses, verification codes, and hop directly to your DNS settings.
            </p>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            See where domain automation<br />can take your project.
          </h2>
          <p className="text-slate-400 mb-10">
            The first 100 subdomains are completely free. And there's a lot more you can save.
          </p>
          <Link to="/login" className="inline-flex px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] items-center gap-2">
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#09090b] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[4px] bg-teal-500"></div>
            <span className="font-bold text-white tracking-wide">StackInfi & Dhanvatix</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Status</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
          <div className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} StackInfi & Dhanvatix Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
