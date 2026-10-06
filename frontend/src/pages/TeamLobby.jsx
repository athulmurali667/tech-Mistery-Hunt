import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Lock, Unlock, Play } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { GameContext } from '../context/GameContext';

export default function TeamLobby() {
  const navigate = useNavigate();
  const { token, logout } = React.useContext(GameContext);
  const [lobbyData, setLobbyData] = useState(null);
  const [error, setError] = useState('');

  const fetchLobby = async () => {
    if (!token) return navigate('/');
    
    try {
      const res = await fetch('http://localhost:8000/api/registration/lobby', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return navigate('/');
      }
      const data = await res.json();
      setLobbyData(data);
    } catch (err) {
      setError('Connection failed');
    }
  };

  useEffect(() => {
    fetchLobby();
    const interval = setInterval(fetchLobby, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartMission = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/registration/start', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/activation');
      } else {
        setError(data.detail || 'Failed to start');
      }
    } catch(err) {
      setError('Connection failed');
    }
  };

  if (!lobbyData) {
    return <div className="min-h-screen bg-[#050505] text-zinc-300 flex items-center justify-center font-mono">LOADING LINK...</div>;
  }

  // If the team is locked and event is live, redirect to game
  if (lobbyData.is_locked) {
    navigate('/activation');
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 flex items-center justify-center p-4 font-sans bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/20 via-[#050505] to-[#050505]">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500"></div>
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white tracking-widest uppercase mb-1">{lobbyData.team_name}</h1>
          <p className="text-cyan-400 font-mono tracking-widest">{lobbyData.team_code}</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/30 text-red-200 p-3 mb-6 text-sm font-mono text-center">
            {error}
          </div>
        )}

        {/* Status Box */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 mb-6 flex justify-between items-center">
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Members</p>
            <p className="text-xl font-mono text-white">{lobbyData.member_count} <span className="text-zinc-500 text-sm">/ 4</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Team Status</p>
            {lobbyData.member_count >= 2 ? (
              <p className="text-green-400 font-mono tracking-widest flex items-center gap-1 justify-end"><Unlock className="w-4 h-4"/> READY</p>
            ) : (
              <p className="text-orange-400 font-mono tracking-widest flex items-center gap-1 justify-end"><Lock className="w-4 h-4"/> WAITING</p>
            )}
          </div>
        </div>

        {/* Member List */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2">Roster</h2>
          <div className="space-y-2">
            {lobbyData.members.map((m, idx) => (
              <div key={idx} className="flex justify-between items-center bg-zinc-950 p-3 border border-zinc-800/50">
                <span className="text-white">{m.name}</span>
                {m.is_captain && <span className="text-[10px] bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded uppercase tracking-widest border border-cyan-800/50">Captain</span>}
              </div>
            ))}
            {[...Array(4 - lobbyData.member_count)].map((_, idx) => (
              <div key={idx} className="flex justify-between items-center bg-zinc-950/50 p-3 border border-zinc-800/30 border-dashed">
                <span className="text-zinc-600 font-mono italic">Waiting for member...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Captain Controls / Join Info */}
        {lobbyData.is_captain ? (
          <div className="space-y-4">
            <div className="bg-zinc-950 border border-zinc-800 p-4 text-center">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-3">Invite Members</p>
              <div className="flex justify-center mb-4">
                <div className="bg-white p-2">
                  <QRCodeSVG value={lobbyData.join_code} size={120} />
                </div>
              </div>
              <p className="text-sm text-zinc-400 mb-1">Share this Join Code:</p>
              <p className="text-3xl font-mono text-cyan-400 tracking-[0.3em]">{lobbyData.join_code}</p>
            </div>
            
            <button 
              onClick={handleStartMission}
              disabled={!lobbyData.can_start}
              className={`w-full py-4 font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-colors ${lobbyData.can_start ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
            >
              <Play className="w-5 h-5" /> Start Mission
            </button>
            {!lobbyData.can_start && lobbyData.event_status !== 'LIVE' && (
              <p className="text-center text-xs text-orange-400 mt-2 font-mono">WAITING FOR EVENT TO START</p>
            )}
            {!lobbyData.can_start && lobbyData.event_status === 'LIVE' && lobbyData.member_count < 2 && (
              <p className="text-center text-xs text-orange-400 mt-2 font-mono">MINIMUM 2 MEMBERS REQUIRED</p>
            )}
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 p-6 text-center">
            <Shield className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm mb-2">Waiting for Captain to initiate mission.</p>
            {lobbyData.event_status !== 'LIVE' ? (
              <p className="text-orange-400 text-xs font-mono">EVENT NOT LIVE</p>
            ) : (
              <p className="text-cyan-400 text-xs font-mono animate-pulse">SYSTEM READY</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
