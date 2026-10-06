import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Search } from 'lucide-react';

export default function Volunteer() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/game/volunteer/teams');
      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setResult(null);
    try {
      const res = await fetch('http://localhost:8000/api/game/volunteer/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: selectedTeam.id,
          checkpoint_sequence: selectedTeam.current_checkpoint_sequence,
          verification_code: verificationCode
        })
      });
      const data = await res.json();
      setResult(data);
      if (data.correct) {
        setTimeout(() => {
          setSelectedTeam(null);
          setVerificationCode('');
          setResult(null);
          fetchTeams();
        }, 2000);
      }
    } catch (err) {
      setResult({ correct: false, message: 'Connection failed' });
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-green-500 p-8">Initializing...</div>;

  return (
    <div className="min-h-screen bg-black text-green-500 p-4 md:p-8 font-mono">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 border-b border-green-500/30 pb-4 flex items-center gap-4">
          <ShieldAlert className="w-8 h-8 text-yellow-500" />
          <h1 className="text-2xl font-bold tracking-widest text-white">VOLUNTEER OVERRIDE TERMINAL</h1>
        </header>

        {!selectedTeam ? (
          <div>
            <p className="text-green-500/60 mb-6">Select a team pending physical clearance:</p>
            <div className="grid gap-4">
              {teams.length === 0 ? (
                <div className="bg-zinc-900 p-6 rounded text-center border border-green-500/10 text-green-500/50">
                  No teams currently await physical verification.
                </div>
              ) : (
                teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className="flex items-center justify-between bg-zinc-900 p-4 rounded border border-green-500/30 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <div>
                      <div className="text-white font-bold">{team.name}</div>
                      <div className="text-xs text-green-500/50">Sequence: {team.current_checkpoint_sequence}</div>
                    </div>
                    <Search className="w-5 h-5" />
                  </button>
                ))
              )}
            </div>
            <button onClick={fetchTeams} className="mt-8 text-xs underline text-green-500/50 hover:text-green-400">
              Refresh List
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 p-6 rounded-lg border border-green-500/50">
            <h2 className="text-xl text-white mb-2">Verify: {selectedTeam.name}</h2>
            <p className="text-sm text-green-500/60 mb-6">Enter organizer authorization code to unlock sequence {selectedTeam.current_checkpoint_sequence}.</p>
            
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="password"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                placeholder="Authorization Code"
                className="w-full bg-black border border-green-500/50 rounded px-4 py-3 text-white focus:outline-none focus:border-green-400"
                required
              />
              <button
                type="submit"
                className="w-full bg-green-500 text-black font-bold py-3 rounded hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
              >
                AUTHORIZE CLEARANCE
              </button>
              <button
                type="button"
                onClick={() => { setSelectedTeam(null); setResult(null); }}
                className="w-full border border-green-500/30 text-green-500 py-2 rounded hover:bg-green-500/10"
              >
                CANCEL
              </button>
            </form>

            {result && (
              <div className={`mt-6 p-4 rounded flex items-center gap-3 ${result.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {result.correct ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                {result.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
