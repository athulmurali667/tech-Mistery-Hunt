import { useState, useEffect } from 'react';
import { Trophy, Clock, Medal, Shield, Activity, XCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/game/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Auto-update every 30s
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return '--:--:--';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour12: false });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-zinc-900 border border-green-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.1)]">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="bg-green-500/20 p-3 rounded-full border border-green-500/50">
              <Trophy className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-400 tracking-widest">GLOBAL LEADERBOARD</h1>
              <p className="text-zinc-500 text-sm">MISSION: RECOVER THE MISSING CODE</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-zinc-500 mb-1">LAST SYNC</div>
              <div className="text-sm text-green-400">{lastUpdated.toLocaleTimeString()}</div>
            </div>
            <button 
              onClick={fetchLeaderboard}
              disabled={loading}
              className="bg-zinc-800 p-3 rounded hover:bg-zinc-700 transition-colors border border-green-500/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-green-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-green-500/10 text-green-400 border border-green-500/50 px-4 py-2 rounded hover:bg-green-500 hover:text-black font-bold transition-colors"
            >
              HOME
            </button>
          </div>
        </header>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 text-xs tracking-widest border-b border-zinc-800">
                  <th className="p-4 w-20 text-center">RANK</th>
                  <th className="p-4">TEAM DESIGNATION</th>
                  <th className="p-4 text-center">SCORE</th>
                  <th className="p-4 text-center">STATUS</th>
                  <th className="p-4 text-right pr-8">COMPLETION TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {leaderboard.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-zinc-500 italic">
                      No teams detected in the network...
                    </td>
                  </tr>
                )}
                {leaderboard.map((team) => (
                  <tr key={team.team_id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-4 text-center">
                      {team.rank === 1 ? (
                        <Medal className="w-6 h-6 text-yellow-500 mx-auto drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                      ) : team.rank === 2 ? (
                        <Medal className="w-6 h-6 text-zinc-300 mx-auto" />
                      ) : team.rank === 3 ? (
                        <Medal className="w-6 h-6 text-amber-700 mx-auto" />
                      ) : (
                        <span className="text-zinc-500 font-bold">{team.rank}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white group-hover:text-green-400 transition-colors flex items-center gap-2">
                        <Shield className="w-4 h-4 text-zinc-600" />
                        {team.name}
                      </div>
                      <div className="text-xs text-zinc-600 mt-1">ID: {team.team_id.substring(0, 8)}...</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xl font-bold text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">{team.score}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest border
                        ${team.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                          team.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                          'bg-blue-500/10 text-blue-400 border-blue-500/30'}
                      `}>
                        {team.status === 'COMPLETED' ? <CheckCircle className="w-3 h-3" /> : 
                         team.status === 'FAILED' ? <XCircle className="w-3 h-3" /> : 
                         <Activity className="w-3 h-3 animate-pulse" />}
                        {team.status}
                      </div>
                    </td>
                    <td className="p-4 text-right pr-8">
                      {team.end_time ? (
                        <div className="flex items-center justify-end gap-2 text-zinc-300">
                          <Clock className="w-4 h-4 text-zinc-500" />
                          {formatTime(team.end_time)}
                        </div>
                      ) : (
                        <span className="text-zinc-700">--:--:--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
