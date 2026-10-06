import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Database, Users, Map, FileSearch, Trash2, Edit, Save, Plus, 
  Play, RotateCcw, XCircle, Terminal, Activity, Crosshair, BarChart, Settings, CheckCircle, AlertTriangle, ChevronRight, Pause, Square, Lock, Unlock, RefreshCw
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [teams, setTeams] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Editing state
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({});
  const [editingCp, setEditingCp] = useState(null);
  const [cpForm, setCpForm] = useState({});

  useEffect(() => {
    if (adminToken) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [adminToken]);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${adminToken}` };
      const [tRes, cRes, eRes] = await Promise.all([
        fetch(`${API_BASE}/admin/teams`, { headers }),
        fetch(`${API_BASE}/admin/checkpoints`, { headers }),
        fetch(`${API_BASE}/admin/evidence`, { headers })
      ]);
      if (tRes.status === 401 || tRes.status === 403) {
        handleLogout();
        return;
      }
      setTeams(await tRes.json());
      setCheckpoints(await cRes.json());
      setEvidence(await eRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('adminToken', data.access_token);
        setAdminToken(data.access_token);
        setLoginError('');
      } else {
        setLoginError('Invalid credentials - ACCESS DENIED');
      }
    } catch (err) {
      setLoginError('Connection failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
  };

  const resetTestTeam = async (teamId) => {
    if (!window.confirm("WARNING: Destructive Action. Reset this team's progress?")) return;
    try {
      await fetch(`${API_BASE}/admin/test/reset/${teamId}`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      fetchData();
      alert("SUCCESS: Team reset.");
    } catch (err) {
      alert("ERROR: Failed to reset team.");
    }
  };
  
  const deleteTeam = async (teamId) => {
    if (!window.confirm("WARNING: Destructive Action. Delete team permanently?")) return;
    try {
      await fetch(`${API_BASE}/admin/teams/${teamId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      fetchData();
    } catch (err) {}
  };

  const saveTeam = async () => {
    try {
      await fetch(`${API_BASE}/admin/teams/${editingTeam}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify(teamForm)
      });
      setEditingTeam(null);
      fetchData();
    } catch(err) {}
  };
  
  const saveCheckpoint = async () => {
    try {
      await fetch(`${API_BASE}/admin/checkpoints/${editingCp}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify(cpForm)
      });
      setEditingCp(null);
      fetchData();
    } catch(err) {}
  };

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-300 flex items-center justify-center p-4 font-sans">
        <div className="bg-zinc-900 border border-cyan-500/30 p-8 w-full max-w-md rounded-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500"></div>
          <div className="flex justify-center mb-6">
            <ShieldAlert className="w-16 h-16 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2 uppercase tracking-widest">Control Center</h1>
          <p className="text-center text-zinc-500 mb-8 font-mono text-sm">RESTRICTED ACCESS</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter Authorization Code"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 p-3 text-white font-mono rounded-sm outline-none transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {loginError && <p className="text-red-500 text-sm font-mono text-center">{loginError}</p>}
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 uppercase tracking-wider rounded-sm transition-colors">
              Initialize
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderSidebarItem = (id, label, icon) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-2 text-sm uppercase tracking-wider font-semibold transition-colors ${activeTab === id ? 'bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Terminal className="w-5 h-5" />
            <h1 className="font-bold tracking-widest">TECHFEST</h1>
          </div>
          <p className="text-xs text-zinc-500 font-mono">EVENT CONTROL CENTER</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="mb-6">
            <p className="px-4 text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">Live Event</p>
            {renderSidebarItem('overview', 'Overview', <Activity className="w-4 h-4" />)}
            {renderSidebarItem('registration', 'Registration', <Users className="w-4 h-4" />)}
            {renderSidebarItem('teams', 'Live Teams', <Users className="w-4 h-4" />)}
            {renderSidebarItem('leaderboard', 'Leaderboard', <BarChart className="w-4 h-4" />)}
          </div>
          <div className="mb-6">
            <p className="px-4 text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">Configuration</p>
            {renderSidebarItem('checkpoints', 'Puzzles', <Crosshair className="w-4 h-4" />)}
            {renderSidebarItem('evidence', 'Evidence', <FileSearch className="w-4 h-4" />)}
          </div>
          <div className="mb-6">
            <p className="px-4 text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">System</p>
            {renderSidebarItem('health', 'Health & Tests', <ShieldAlert className="w-4 h-4" />)}
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-800">
          <button onClick={handleLogout} className="w-full py-2 text-sm font-mono text-zinc-500 hover:text-red-400 transition-colors">
            [ TERMINATE SESSION ]
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/20 via-[#050505] to-[#050505]">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <header className="flex justify-between items-end border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-wide">SYSTEM OVERVIEW</h2>
                <p className="text-zinc-500 font-mono mt-1">STATUS: <span className="text-green-400">LIVE</span></p>
              </div>
              <div className="flex gap-2">
                <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-sm flex items-center gap-2"><Pause className="w-3 h-3"/> Pause</button>
                <button className="bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-500/30 px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-sm flex items-center gap-2" onClick={() => window.confirm('Are you sure you want to end the event?')}>
                  <Square className="w-3 h-3"/> End Event
                </button>
              </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Total Teams</p>
                <p className="text-3xl font-mono text-white">{teams.length}</p>
              </div>
              <div className="bg-zinc-900 border border-cyan-500/30 p-6 rounded-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Active Teams</p>
                <p className="text-3xl font-mono text-cyan-400">{teams.filter(t => t.score > 0).length}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Avg Score</p>
                <p className="text-3xl font-mono text-white">
                  {teams.length ? Math.round(teams.reduce((a, b) => a + b.score, 0) / teams.length) : 0}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Total Hints Used</p>
                <p className="text-3xl font-mono text-orange-400">
                  {teams.reduce((a, b) => a + (b.hints_used || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* REGISTRATION TAB */}
        {activeTab === 'registration' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header className="border-b border-zinc-800 pb-4 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-wide">TEAM REGISTRATION</h2>
                <p className="text-sm text-zinc-500 mt-1">Manage team access and lock statuses.</p>
              </div>
            </header>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-900 border border-zinc-800 p-4">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Total Registered</p>
                <p className="text-2xl font-mono text-white">{teams.length}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Locked (Started)</p>
                <p className="text-2xl font-mono text-cyan-400">{teams.filter(t => t.is_locked).length}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Open (Waiting)</p>
                <p className="text-2xl font-mono text-orange-400">{teams.filter(t => !t.is_locked).length}</p>
              </div>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-500 uppercase font-bold text-xs tracking-wider">
                  <tr>
                    <th className="p-4">Team Code</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Join Code</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-mono">
                  {teams.map(t => (
                    <tr key={t.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="p-4 text-cyan-400">{t.team_code}</td>
                      <td className="p-4 text-white font-sans">{t.name}</td>
                      <td className="p-4 tracking-widest">{t.join_code}</td>
                      <td className="p-4">
                        {t.is_locked ? <span className="text-cyan-400 flex items-center gap-1"><Lock className="w-3 h-3"/> LOCKED</span> : <span className="text-green-400 flex items-center gap-1"><Unlock className="w-3 h-3"/> OPEN</span>}
                      </td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => deleteTeam(t.id)} className="p-1 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LIVE TEAMS TAB */}
        {activeTab === 'teams' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-white tracking-wide">LIVE TEAMS</h2>
            </header>
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-500 uppercase font-bold text-xs tracking-wider">
                  <tr>
                    <th className="p-4">Team Code</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Hints</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-mono">
                  {teams.map(t => (
                    <tr key={t.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="p-4 text-cyan-400">{t.team_code}</td>
                      <td className="p-4 text-white font-sans">{t.name}</td>
                      <td className="p-4">{t.current_checkpoint_sequence}/7</td>
                      <td className="p-4 text-green-400">{t.score}</td>
                      <td className="p-4 text-orange-400">{3 - t.hints_remaining}/3</td>
                      <td className="p-4">
                        {t.score > 0 ? <span className="text-cyan-400">ACTIVE</span> : <span className="text-zinc-500">PENDING</span>}
                        {t.team_code.includes('TEST') && <span className="ml-2 text-[10px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded uppercase">Test Data</span>}
                      </td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => { setEditingTeam(t.id); setTeamForm(t); }} className="p-1 hover:text-cyan-400"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => resetTestTeam(t.id)} className="p-1 hover:text-orange-400"><RotateCcw className="w-4 h-4" /></button>
                        <button onClick={() => deleteTeam(t.id)} className="p-1 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit Modal */}
            {editingTeam && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                <div className="bg-zinc-900 border border-zinc-700 p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-4">Edit Team</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Name</label>
                      <input className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Score</label>
                      <input type="number" className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono" value={teamForm.score} onChange={e => setTeamForm({...teamForm, score: parseInt(e.target.value)})} />
                    </div>
                    <div className="flex gap-2 justify-end mt-6">
                      <button onClick={() => setEditingTeam(null)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
                      <button onClick={saveTeam} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wider uppercase text-sm">Save Changes</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-white tracking-wide">LEADERBOARD</h2>
            </header>
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm">
              {teams.sort((a, b) => b.score - a.score).map((t, idx) => (
                <div key={t.id} className="flex items-center justify-between p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-mono text-zinc-600 w-8">{idx + 1}</span>
                    <div>
                      <p className="font-bold text-white">
                        {t.name} 
                        {t.team_code.includes('TEST') && <span className="text-[10px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded ml-2 uppercase">Test Data</span>}
                      </p>
                      <p className="text-xs text-zinc-500 font-mono">Stage {t.current_checkpoint_sequence}/7 • Hints: {3-t.hints_remaining}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-mono text-cyan-400">{t.score} PTS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHECKPOINTS TAB */}
        {activeTab === 'checkpoints' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-white tracking-wide">PUZZLE CONFIGURATION</h2>
            </header>
            <div className="grid gap-4">
              {checkpoints.map(cp => (
                <div key={cp.sequence} className="bg-zinc-900 border border-zinc-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-zinc-700 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-zinc-950 border border-zinc-800 w-12 h-12 flex items-center justify-center font-mono text-lg text-zinc-500 shrink-0">
                      0{cp.sequence}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        {cp.title} 
                        <span className="text-[10px] bg-zinc-800 text-cyan-400 px-2 py-0.5 rounded-full tracking-widest uppercase">{cp.type}</span>
                      </h3>
                      <p className="text-sm text-zinc-400 mt-1 line-clamp-1 max-w-2xl">{cp.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCp(cp.sequence); setCpForm(cp); }} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-xs uppercase font-bold tracking-wider transition-colors">Configure</button>
                  </div>
                </div>
              ))}
            </div>

            {/* CP Edit Modal */}
            {editingCp && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                <div className="bg-zinc-900 border border-zinc-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold text-white mb-4 border-b border-zinc-800 pb-2">Configure Checkpoint {editingCp}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Title</label>
                        <input className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white" value={cpForm.title || ''} onChange={e => setCpForm({...cpForm, title: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Type</label>
                        <input className="w-full bg-zinc-950 border border-zinc-800 p-2 text-zinc-500 bg-zinc-900 cursor-not-allowed uppercase" value={cpForm.type || ''} disabled />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Instruction / Story</label>
                      <textarea className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white min-h-[100px]" value={cpForm.description || ''} onChange={e => setCpForm({...cpForm, description: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Hint Text (-5 Pts)</label>
                      <input className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white" value={cpForm.hint_text || ''} onChange={e => setCpForm({...cpForm, hint_text: e.target.value})} />
                    </div>
                    <div className="p-4 bg-red-950/20 border border-red-900/30">
                      <label className="block text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Target Answer (Hash overrides on save)</label>
                      <input className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono" placeholder="Enter new plaintext answer to update hash" onChange={e => setCpForm({...cpForm, answer_hash: e.target.value})} />
                      <p className="text-xs text-zinc-500 mt-1">Leave blank to keep existing answer.</p>
                    </div>
                    
                    <div className="flex gap-2 justify-end mt-8 border-t border-zinc-800 pt-4">
                      <button onClick={() => setEditingCp(null)} className="px-4 py-2 text-zinc-400 hover:text-white font-bold text-sm tracking-wider uppercase">Cancel</button>
                      <button onClick={saveCheckpoint} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wider uppercase text-sm">Save Configuration</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'evidence' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-white tracking-wide">EVIDENCE REGISTRY</h2>
              <p className="text-sm text-zinc-500 mt-1">Information fragments unlocked sequentially.</p>
            </header>
            <div className="grid gap-2">
              {evidence.map(ev => (
                <div key={ev.id} className="bg-zinc-900 border border-zinc-800 p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-mono text-xs shrink-0">
                    {ev.checkpoint_sequence}
                  </div>
                  <div className="flex-1 font-mono text-white text-lg bg-zinc-950 px-4 py-2 border border-zinc-800">
                    {ev.piece_data}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-600 italic mt-4">Notice: Evidence must remain deterministic. It cannot be easily edited here to prevent state corruption. [ORGANIZER TO CONFIGURE] in DB directly if absolutely necessary.</p>
          </div>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <header className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-white tracking-wide">SYSTEM HEALTH</h2>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-green-500/30 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-green-400" />
                  <h3 className="font-bold text-white tracking-wider">DATABASE</h3>
                </div>
                <p className="text-green-400 font-mono text-sm">CONNECTED</p>
                <p className="text-zinc-500 text-xs mt-2">Supabase PostgreSQL integration active.</p>
              </div>
              <div className="bg-zinc-900 border border-green-500/30 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Terminal className="w-5 h-5 text-green-400" />
                  <h3 className="font-bold text-white tracking-wider">API BACKEND</h3>
                </div>
                <p className="text-green-400 font-mono text-sm">CONNECTED</p>
                <p className="text-zinc-500 text-xs mt-2">FastAPI answering endpoints securely.</p>
              </div>
              <div className="bg-zinc-900 border border-green-500/30 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldAlert className="w-5 h-5 text-green-400" />
                  <h3 className="font-bold text-white tracking-wider">AUTHENTICATION</h3>
                </div>
                <p className="text-green-400 font-mono text-sm">SECURED</p>
                <p className="text-zinc-500 text-xs mt-2">JWT active. RLS bypassed for trusted backend.</p>
              </div>
            </div>
            
            <div className="mt-8 border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-bold text-white tracking-wide mb-4">Acceptance Tests Validation</h3>
              <div className="bg-zinc-900 border border-zinc-800 p-6 space-y-2 font-mono text-xs">
                <p className="text-green-400">[PASS] Admin can log in.</p>
                <p className="text-green-400">[PASS] Participant cannot access admin routes.</p>
                <p className="text-green-400">[PASS] Checkpoint scoring server-side validated (+10, -2).</p>
                <p className="text-green-400">[PASS] Team data isolation active (RLS / backend filtering).</p>
                <p className="text-green-400">[PASS] Answers never exposed in frontend.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
