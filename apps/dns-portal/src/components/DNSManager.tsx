import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Globe, Server, Activity, ShieldCheck, Edit2, Check, X } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DNSManagerProps {
  domainId: string;
  rootDomain: string;
  onBack: () => void;
}

export default function DNSManager({ domainId, rootDomain, onBack }: DNSManagerProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'A',
    name: '',
    content: '',
    ttl: 1, // 1 = Auto in Cloudflare
    proxied: false,
  });

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`${API_URL}/dns/${domainId}/records`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (e) {
      console.error('Failed to fetch records', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [domainId]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAdding(true);
      const res = await apiFetch(`${API_URL}/dns/${domainId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      
      if (res.ok) {
        setNewRecord({ type: 'A', name: '', content: '', ttl: 1, proxied: false });
        // Optimistically reload records after a short delay (Cloudflare API is fast)
        setTimeout(fetchRecords, 500);
      } else {
        const error = await res.json();
        alert(`Error adding record: ${error.message}`);
      }
    } catch (e) {
      alert('Network error adding record');
    } finally {
      setIsAdding(false);
    }
  };

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState({
    type: 'A',
    name: '',
    content: '',
    ttl: 1,
    proxied: false,
  });

  const startEditing = (record: any) => {
    setEditingRecordId(record.id);
    setEditRecord({
      type: record.type,
      name: record.name.replace(`.${rootDomain}`, '').replace(rootDomain, '@'),
      content: record.content,
      ttl: record.ttl || 1,
      proxied: record.proxied
    });
  };

  const handleUpdateRecord = async (recordId: string) => {
    try {
      const res = await apiFetch(`${API_URL}/dns/${domainId}/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRecord)
      });
      
      if (res.ok) {
        setEditingRecordId(null);
        setTimeout(fetchRecords, 500);
      } else {
        const error = await res.json();
        alert(`Error updating record: ${error.message}`);
      }
    } catch (e) {
      alert('Network error updating record');
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const res = await apiFetch(`${API_URL}/dns/${domainId}/records/${recordId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setRecords(records.filter(r => r.id !== recordId));
      } else {
        const error = await res.json();
        alert(`Failed to delete record: ${error.message}`);
      }
    } catch (e) {
      alert('Error deleting record');
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Cloudflare-style Add Record Bar */}
      <div className="bg-[#121214] rounded-2xl p-6 mb-8 border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-500"></div>
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Plus size={20} className="text-purple-400" />
          Add New Record
        </h3>
        <form onSubmit={handleAddRecord}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Type */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Type</label>
              <div className="relative">
                <select 
                  value={newRecord.type}
                  onChange={(e) => setNewRecord({...newRecord, type: e.target.value})}
                  className="w-full p-3 rounded-xl border border-white/10 bg-black/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all appearance-none font-medium"
                >
                  <option value="A">A</option>
                  <option value="AAAA">AAAA</option>
                  <option value="CNAME">CNAME</option>
                  <option value="TXT">TXT</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  ▼
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="@"
                  value={newRecord.name}
                  onChange={(e) => setNewRecord({...newRecord, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-white/10 bg-black/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all font-mono text-sm"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">Use @ for root ({rootDomain})</p>
            </div>

            {/* Target */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                {newRecord.type === 'A' ? 'IPv4 Address' : newRecord.type === 'AAAA' ? 'IPv6 Address' : 'Target'}
              </label>
              <input 
                type="text" 
                required
                placeholder={newRecord.type === 'A' ? '192.0.2.1' : 'e.g. target.example.com'}
                value={newRecord.content}
                onChange={(e) => setNewRecord({...newRecord, content: e.target.value})}
                className="w-full p-3 rounded-xl border border-white/10 bg-black/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all font-mono text-sm"
              />
            </div>

            {/* Proxy Status */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Proxy Status</label>
              <div className="flex items-center gap-4 mt-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={newRecord.proxied}
                    onChange={(e) => setNewRecord({...newRecord, proxied: e.target.checked})}
                    disabled={newRecord.type === 'TXT'}
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 border border-white/10"></div>
                  <span className={`ml-3 text-sm font-bold ${newRecord.proxied ? 'text-orange-400' : 'text-slate-500'}`}>
                    {newRecord.proxied ? 'Proxied' : 'DNS only'}
                  </span>
                </label>
              </div>
            </div>

            {/* TTL */}
            <div className="md:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">TTL</label>
              <div className="relative">
                <select 
                  value={newRecord.ttl}
                  onChange={(e) => setNewRecord({...newRecord, ttl: Number(e.target.value)})}
                  className="w-full p-3 rounded-xl border border-white/10 bg-black/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all appearance-none text-sm font-medium"
                >
                  <option value={1}>Auto</option>
                  <option value={60}>1 min</option>
                  <option value={120}>2 min</option>
                  <option value={300}>5 min</option>
                  <option value={600}>10 min</option>
                  <option value={900}>15 min</option>
                  <option value={1800}>30 min</option>
                  <option value={3600}>1 hr</option>
                  <option value={7200}>2 hr</option>
                  <option value={18000}>5 hr</option>
                  <option value={43200}>12 hr</option>
                  <option value={86400}>1 day</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  ▼
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-white/5">
            <button 
              type="submit" 
              disabled={isAdding}
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] disabled:opacity-50 flex items-center gap-2"
            >
              {isAdding ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                <>
                  <Plus size={18} />
                  Save Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Records Table */}
      <div className="bg-[#121214] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity size={18} className="text-blue-400" />
            </div>
            Active Records
          </h3>
          <div className="text-sm font-medium text-slate-500 bg-black/40 px-3 py-1 rounded-full border border-white/5">
            {records.length} records found
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-slate-500 text-[11px] uppercase tracking-widest border-b border-white/5">
                <th className="p-4 pl-6 font-bold">Type</th>
                <th className="p-4 font-bold">Name</th>
                <th className="p-4 font-bold">Content</th>
                <th className="p-4 font-bold">Proxy Status</th>
                <th className="p-4 font-bold">TTL</th>
                <th className="p-4 pr-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <div className="animate-pulse flex items-center justify-center gap-2">
                      <Activity size={20} className="animate-spin" /> Fetching records from Cloudflare...
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Server size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-lg text-slate-400 mb-1">No DNS records found</p>
                    <p className="text-sm text-slate-500">Use the form above to add your first record.</p>
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-slate-800/40 transition group">
                    {editingRecordId === r.id ? (
                      <>
                        <td className="p-4">
                          <select 
                            value={editRecord.type}
                            onChange={(e) => setEditRecord({...editRecord, type: e.target.value})}
                            className="w-full p-1.5 rounded border border-slate-700 bg-slate-800 text-white text-sm"
                          >
                            <option value="A">A</option>
                            <option value="AAAA">AAAA</option>
                            <option value="CNAME">CNAME</option>
                            <option value="TXT">TXT</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <input 
                            type="text" 
                            value={editRecord.name}
                            onChange={(e) => setEditRecord({...editRecord, name: e.target.value})}
                            className="w-full p-1.5 rounded border border-slate-700 bg-slate-800 text-white font-mono text-sm"
                          />
                        </td>
                        <td className="p-4">
                          <input 
                            type="text" 
                            value={editRecord.content}
                            onChange={(e) => setEditRecord({...editRecord, content: e.target.value})}
                            className="w-full p-1.5 rounded border border-slate-700 bg-slate-800 text-white font-mono text-sm"
                          />
                        </td>
                        <td className="p-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={editRecord.proxied}
                              onChange={(e) => setEditRecord({...editRecord, proxied: e.target.checked})}
                              disabled={editRecord.type === 'TXT'}
                            />
                            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                          </label>
                        </td>
                        <td className="p-4">
                          <select 
                            value={editRecord.ttl}
                            onChange={(e) => setEditRecord({...editRecord, ttl: Number(e.target.value)})}
                            className="w-full p-1.5 rounded border border-slate-700 bg-slate-800 text-white text-sm"
                          >
                            <option value={1}>Auto</option>
                            <option value={60}>1 min</option>
                            <option value={120}>2 min</option>
                            <option value={300}>5 min</option>
                            <option value={600}>10 min</option>
                            <option value={900}>15 min</option>
                            <option value={1800}>30 min</option>
                            <option value={3600}>1 hr</option>
                            <option value={7200}>2 hr</option>
                            <option value={18000}>5 hr</option>
                            <option value={43200}>12 hr</option>
                            <option value={86400}>1 day</option>
                          </select>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2 pr-6">
                          <button 
                            onClick={() => handleUpdateRecord(r.id)}
                            className="bg-green-500 hover:bg-green-400 text-black p-2 rounded-lg font-bold transition shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                            title="Save Record"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => setEditingRecordId(null)}
                            className="bg-slate-800 text-slate-300 p-2 rounded-lg hover:bg-slate-700 transition border border-white/10"
                            title="Cancel Edit"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 pl-6">
                          <span className={`font-mono text-xs font-bold px-2 py-1 rounded-md ${
                            r.type === 'A' || r.type === 'AAAA' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                            r.type === 'CNAME' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 
                            'bg-slate-800 text-slate-300 border border-white/10'
                          }`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-white text-sm">{r.name}</td>
                        <td className="p-4 font-mono text-sm text-slate-400 max-w-[300px] truncate" title={r.content}>
                          {r.content}
                        </td>
                        <td className="p-4">
                          {r.proxied ? (
                            <span className="flex items-center gap-1.5 text-orange-400 text-xs font-bold bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 w-fit">
                              <ShieldCheck size={14} /> Proxied
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-full border border-white/5 w-fit">DNS Only</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-sm text-slate-400 font-medium">
                          {r.ttl === 1 ? 'Auto' : r.ttl >= 86400 ? `${r.ttl / 86400} day` : r.ttl >= 3600 ? `${r.ttl / 3600} hr` : `${r.ttl / 60} min`}
                        </td>
                        <td className="p-4 pr-6 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => startEditing(r)}
                            className="bg-blue-500/10 text-blue-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-blue-500/20 hover:scale-110"
                            title="Edit Record"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteRecord(r.id)}
                            className="bg-red-500/10 text-red-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-red-500/20 hover:scale-110"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
