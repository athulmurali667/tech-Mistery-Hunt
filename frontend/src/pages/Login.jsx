import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';
import { Terminal, Lock } from 'lucide-react';

export default function Login() {
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(GameContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_code: teamCode }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Access Denied');
      }
      
      login(data.team, data.access_token);
      navigate('/activation');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="backdrop-blur-xl bg-zinc-900/50 border border-green-500/30 p-8 rounded-2xl shadow-[0_0_40px_-10px_rgba(34,197,94,0.2)]">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-4 animate-pulse">
              <Lock className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 tracking-wider text-center">
              TECH_MYSTERY_HUNT
            </h1>
            <p className="text-zinc-400 mt-2 text-sm uppercase tracking-widest font-mono">
              Master Access Protocol
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-green-500/80 mb-2 font-mono">
                &gt; ENTER_TEAM_CODE
              </label>
              <div className="relative group">
                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500/50 group-focus-within:text-green-400 transition-colors" />
                <input 
                  type="text" 
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-950/50 border border-green-500/30 text-green-400 px-10 py-3 rounded-lg focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all font-mono uppercase placeholder-zinc-700"
                  placeholder="e.g. ALPHA-7"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm font-mono flex items-center">
                <span className="mr-2">!</span> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 text-zinc-950 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] font-mono tracking-wider flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]"
            >
              {loading ? 'AUTHENTICATING...' : 'INITIALIZE_CONNECTION'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/leaderboard')}
              className="text-green-500/50 hover:text-green-400 font-mono text-sm underline underline-offset-4 tracking-widest transition-colors"
            >
              VIEW GLOBAL LEADERBOARD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
