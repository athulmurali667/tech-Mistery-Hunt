import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, UserPlus, QrCode } from 'lucide-react';
import { GameContext } from '../context/GameContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = React.useContext(GameContext);
  const [mode, setMode] = useState('select'); // select, create, join
  const [error, setError] = useState('');
  
  // Create Form
  const [createData, setCreateData] = useState({ team_name: '', captain_name: '', contact: '', department: '' });
  
  // Join Form
  const [joinData, setJoinData] = useState({ join_code: '', member_name: '', contact: '', department: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/registration/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData)
      });
      const data = await res.json();
      if (res.ok) {
        login({ id: data.team_id, name: createData.team_name, current_checkpoint_sequence: 1 }, data.access_token);
        navigate('/lobby'); // Navigate to lobby
      } else {
        setError(data.detail || 'Failed to create team');
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/registration/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(joinData)
      });
      const data = await res.json();
      if (res.ok) {
        login({ id: data.team_id, name: data.team_name, current_checkpoint_sequence: 1 }, data.access_token);
        navigate('/lobby');
      } else {
        setError(data.detail || 'Failed to join team');
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 flex items-center justify-center p-4 font-sans bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/20 via-[#050505] to-[#050505]">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white tracking-widest uppercase">The Missing Code</h1>
          <p className="text-zinc-500 font-mono mt-2 text-sm">TECHFEST REGISTRATION TERMINAL</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/30 text-red-200 p-3 mb-6 text-sm font-mono text-center">
            {error}
          </div>
        )}

        {mode === 'select' && (
          <div className="space-y-4">
            <button 
              onClick={() => setMode('create')}
              className="w-full bg-cyan-600/20 border border-cyan-500 hover:bg-cyan-600/30 text-white p-6 flex flex-col items-center gap-3 transition-colors group"
            >
              <Users className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold tracking-widest uppercase">Create Team</span>
              <span className="text-xs text-zinc-400">Become a Captain and invite members</span>
            </button>

            <button 
              onClick={() => setMode('join')}
              className="w-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white p-6 flex flex-col items-center gap-3 transition-colors group"
            >
              <UserPlus className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="font-bold tracking-widest uppercase">Join Team</span>
              <span className="text-xs text-zinc-500">Enter a code or scan QR from your Captain</span>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">Initialize Team</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Team Name</label>
                <input required className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white" value={createData.team_name} onChange={e => setCreateData({...createData, team_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Captain Name</label>
                <input required className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white" value={createData.captain_name} onChange={e => setCreateData({...createData, captain_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Contact (Phone/Email)</label>
                <input required className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white" value={createData.contact} onChange={e => setCreateData({...createData, contact: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Department/College</label>
                <input required className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white" value={createData.department} onChange={e => setCreateData({...createData, department: e.target.value})} />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setMode('select')} className="px-4 py-3 bg-zinc-800 text-zinc-300 font-bold uppercase tracking-wider hover:bg-zinc-700">Back</button>
                <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider py-3">Create</button>
              </div>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">Join Team</h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Join Code</label>
                <div className="flex gap-2">
                  <input required className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-cyan-400 font-mono tracking-widest uppercase text-center" value={joinData.join_code} onChange={e => setJoinData({...joinData, join_code: e.target.value})} placeholder="XXXXXX" />
                  <button type="button" className="bg-zinc-800 hover:bg-zinc-700 p-3 text-white"><QrCode /></button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Your Name</label>
                <input required className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white" value={joinData.member_name} onChange={e => setJoinData({...joinData, member_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Contact (Phone/Email)</label>
                <input required className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white" value={joinData.contact} onChange={e => setJoinData({...joinData, contact: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Department/College</label>
                <input required className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white" value={joinData.department} onChange={e => setJoinData({...joinData, department: e.target.value})} />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setMode('select')} className="px-4 py-3 bg-zinc-800 text-zinc-300 font-bold uppercase tracking-wider hover:bg-zinc-700">Back</button>
                <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider py-3">Join</button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
