import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Lock, Unlock, LogOut, ChevronRight, Trophy, Clock } from 'lucide-react';

export default function Dashboard() {
  const { team, token, logout, updateTeam } = useContext(GameContext);
  const navigate = useNavigate();
  const [checkpoints, setCheckpoints] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const stateRes = await fetch('http://localhost:8000/api/game/state', { headers });
        if (stateRes.ok) {
           const stateData = await stateRes.json();
           updateTeam(stateData);
        }

        const cpRes = await fetch('http://localhost:8000/api/game/checkpoints', { headers });
        if (cpRes.ok) {
           const cpData = await cpRes.json();
           setCheckpoints(cpData);
        }

        const evRes = await fetch('http://localhost:8000/api/game/evidence', { headers });
        if (evRes.ok) {
           const evData = await evRes.json();
           setEvidence(evData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const activeCheckpointIndex = checkpoints.findIndex(c => c.sequence === team.current_checkpoint_sequence);
  
  return (
    <div className="min-h-screen bg-zinc-950 p-6 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
      
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 bg-zinc-900/50 p-6 rounded-xl border border-green-500/20 backdrop-blur-sm shadow-[0_0_30px_rgba(34,197,94,0.05)]">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold text-green-400 font-mono tracking-wider flex items-center gap-3">
              <Shield className="w-6 h-6" />
              TEAM: {team.name}
            </h1>
            <p className="text-zinc-500 font-mono mt-1 text-sm">ACCESS LEVEL: VERIFIED</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xl font-bold text-green-400 font-mono drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">{team.score} PTS</div>
              <div className="text-zinc-500 font-mono text-sm flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" /> {team.hints_remaining} HINTS LEFT
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/30"
              title="Disconnect"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {team.current_checkpoint_sequence > 7 ? (
          <div className="bg-zinc-900 border-2 border-emerald-500/50 rounded-2xl p-10 text-center shadow-[0_0_50px_rgba(16,185,129,0.2)] mb-8 animate-in fade-in zoom-in duration-1000">
            <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
            <h2 className="text-4xl font-bold text-emerald-400 font-mono tracking-widest mb-4">MISSION ACCOMPLISHED</h2>
            <p className="text-xl text-emerald-500/80 font-mono mb-8">THE MASTER CODE HAS BEEN RECOVERED.</p>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-black/50 border border-emerald-500/30 p-6 rounded-xl">
                <div className="text-emerald-500/60 text-sm font-mono tracking-widest mb-2">FINAL SCORE</div>
                <div className="text-3xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{team.score}</div>
              </div>
              <div className="bg-black/50 border border-emerald-500/30 p-6 rounded-xl">
                <div className="text-emerald-500/60 text-sm font-mono tracking-widest mb-2 flex items-center justify-center gap-2"><Clock className="w-4 h-4"/> COMPLETION TIME</div>
                <div className="text-xl font-bold text-white mt-1">
                  {team.end_time ? new Date(team.end_time).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-green-500 font-mono mb-6 text-lg tracking-widest border-b border-green-500/20 pb-2">
              // AVAILABLE DIRECTORIES
            </h2>
            
            {loading ? (
              <div className="text-green-500/50 font-mono animate-pulse">Scanning network...</div>
            ) : (
              checkpoints.map((cp, index) => {
                const isActive = index === activeCheckpointIndex || (activeCheckpointIndex === -1 && index === 0);
                const isCompleted = activeCheckpointIndex === -1 ? true : index < activeCheckpointIndex;
                const isLocked = !isActive && !isCompleted;

                return (
                  <div 
                    key={cp.sequence}
                    onClick={() => (isActive || isCompleted) && navigate(`/checkpoint/${cp.sequence}`)}
                    className={`
                      p-6 rounded-xl border font-mono transition-all duration-300 relative overflow-hidden
                      ${isLocked ? 'bg-zinc-900/30 border-zinc-800 opacity-60 cursor-not-allowed' : 
                        isActive ? 'bg-green-500/10 border-green-500/50 hover:bg-green-500/20 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.15)] group' : 
                        'bg-zinc-900/50 border-green-500/20 cursor-pointer hover:bg-zinc-800'}
                    `}
                  >
                    {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-green-500 shadow-[0_0_10px_#22c55e]" />}
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${isLocked ? 'bg-zinc-800 text-zinc-600' : isActive ? 'bg-green-500/20 text-green-400' : 'bg-green-900/30 text-green-500'}`}>
                          {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 mb-1">NODE {cp.sequence}</div>
                          <h3 className={`text-lg font-bold ${isLocked ? 'text-zinc-500' : 'text-green-400 group-hover:text-green-300 transition-colors'}`}>
                            {cp.title}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {isCompleted && <span className="text-emerald-500 text-sm tracking-wider">COMPLETED</span>}
                        {isActive && (
                          <span className="flex items-center gap-2 text-green-400 animate-pulse text-sm tracking-wider">
                            ACTIVE <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="md:col-span-1">
            <div className="bg-zinc-900/50 rounded-xl border border-blue-500/20 p-6 sticky top-6">
              <h2 className="text-blue-400 font-mono mb-4 text-sm tracking-widest border-b border-blue-500/20 pb-2 flex items-center justify-between">
                <span>// EVIDENCE</span>
                <span className="text-xs bg-blue-500/10 px-2 py-1 rounded text-blue-300">{evidence.length} / 6</span>
              </h2>
              
              <div className="space-y-3">
                {evidence.length === 0 && !loading && (
                  <div className="text-zinc-600 text-sm font-mono italic">No evidence collected yet.</div>
                )}
                {evidence.map(ev => (
                  <div key={ev.sequence} className="bg-zinc-950 border border-blue-500/30 p-3 rounded flex items-center gap-3 group hover:border-blue-500/60 transition-colors">
                    <div className="text-blue-500/50 font-bold text-xs">#{ev.sequence}</div>
                    <div className="text-blue-300 font-mono tracking-widest break-all">
                      {ev.piece_data}
                    </div>
                  </div>
                ))}
                
                {Array.from({ length: 6 - evidence.length }).map((_, i) => (
                  <div key={`locked-${i}`} className="bg-zinc-950/30 border border-zinc-800 p-3 rounded flex items-center gap-3">
                    <Lock className="w-3 h-3 text-zinc-700" />
                    <div className="w-full h-2 bg-zinc-800 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
