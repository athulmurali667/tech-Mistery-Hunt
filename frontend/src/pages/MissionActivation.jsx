import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';
import { QrCode, ShieldAlert, Fingerprint, Crosshair, TerminalSquare, Play, AlertTriangle, CheckCircle } from 'lucide-react';

export default function MissionActivation() {
  const { team, token, updateTeam } = useContext(GameContext);
  const navigate = useNavigate();
  
  const [clueRevealed, setClueRevealed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [checkpoint, setCheckpoint] = useState(null);
  
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // If team is already past round 1, they shouldn't be here (or we just let them proceed)
  useEffect(() => {
    if (team?.current_checkpoint_sequence > 1) {
      navigate('/dashboard');
    }
  }, [team, navigate]);

  const handleScanQR = async () => {
    setScanning(true);
    // Simulate scanning delay
    setTimeout(async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        // Round 1 is checkpoint sequence 1
        const res = await fetch(`http://localhost:8000/api/game/checkpoints/1`, { headers });
        if (res.ok) {
          const data = await res.json();
          setCheckpoint(data);
          setClueRevealed(true);
        }
      } catch (err) {
        console.error("Error fetching clue", err);
      } finally {
        setScanning(false);
      }
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(`http://localhost:8000/api/game/checkpoints/1/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer: answer }),
      });
      const data = await res.json();
      setResult(data);
      
      if (data.correct) {
        updateTeam({ 
          score: team.score + 10,
          current_checkpoint_sequence: 2 
        });
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        updateTeam({ score: team.score - 2 });
      }
    } catch (err) {
      setResult({ correct: false, message: 'Connection failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-green-500 font-mono p-4 sm:p-8 relative overflow-hidden flex flex-col justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/10 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
      
      <div className="max-w-4xl mx-auto w-full relative z-10">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-green-500/30 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-widest text-red-500 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                CASE ID: TMH-01
              </div>
              <div className="text-sm text-green-500/70 uppercase tracking-widest mt-1">
                MISSION: RECOVER THE MISSING CODE
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-start md:items-end bg-zinc-900/50 p-3 rounded-lg border border-green-500/20 shadow-inner">
            <div className="text-xs text-green-500/50 mb-1 tracking-widest">TEAM IDENTIFICATION</div>
            <div className="font-bold text-lg text-green-400 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 opacity-50" /> 
              {team?.name || 'UNKNOWN_TEAM'}
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-900/40 border border-green-500/20 p-6 sm:p-8 rounded-xl relative backdrop-blur-sm shadow-[0_0_30px_rgba(34,197,94,0.05)]">
              <TerminalSquare className="absolute top-4 right-4 w-5 h-5 text-green-500/30" />
              <h2 className="text-green-500 font-bold mb-6 tracking-widest border-b border-green-500/20 pb-2 inline-block uppercase text-sm">
                // {clueRevealed ? 'ROUND 1: LOCATION CLUE' : 'EXECUTIVE BRIEFING'}
              </h2>
              
              {!clueRevealed ? (
                <div className="space-y-4 text-lg text-zinc-300 leading-relaxed font-mono">
                  <p className="text-red-400 font-bold tracking-wide uppercase drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                    "THE MASTER CODE HAS DISAPPEARED."
                  </p>
                  <p className="opacity-90">
                    Six pieces of evidence are hidden across the campus.
                  </p>
                  <div className="pl-4 border-l-2 border-green-500/50 space-y-3 py-2 my-6">
                    <div className="flex items-center gap-3 text-green-400"><Crosshair className="w-4 h-4" /> Find them.</div>
                    <div className="flex items-center gap-3 text-green-400"><Crosshair className="w-4 h-4" /> Decode them.</div>
                    <div className="flex items-center gap-3 text-green-400"><Crosshair className="w-4 h-4" /> Connect them.</div>
                  </div>
                  <p className="font-bold text-green-400 uppercase tracking-widest mt-6 text-xl">
                    Recover the Missing Code.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="prose prose-invert prose-green max-w-none font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {checkpoint?.description}
                  </div>
                  
                  <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-green-500/80 mb-2 font-mono flex items-center gap-2">
                        <span className="text-green-500 animate-pulse">&gt;</span> ENTER_LOCATION_CODENAME
                      </label>
                      <input 
                        type="text" 
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-full bg-zinc-950/80 border border-green-500/30 text-green-400 px-5 py-4 rounded-lg focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all font-mono placeholder-zinc-700"
                        placeholder="e.g. LOCATION_1"
                        required
                      />
                    </div>
                    
                    {result && (
                      <div className={`p-4 rounded-lg flex items-start gap-3 font-mono text-sm animate-in fade-in ${result.correct ? 'bg-green-500/10 border border-green-500/50 text-green-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'}`}>
                        {result.correct ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                        <div>
                          <div className="font-bold mb-1 tracking-wider">{result.correct ? 'LOCATION VERIFIED' : 'INCORRECT LOCATION'}</div>
                          <div className="opacity-80">{result.message}</div>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      type="submit" 
                      disabled={submitting || (result && result.correct)}
                      className="w-full bg-green-500 hover:bg-green-400 text-zinc-950 font-bold py-4 px-4 rounded-lg transition-all font-mono tracking-widest flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                    >
                      {submitting ? 'VERIFYING...' : 'CONFIRM LOCATION'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl flex flex-col justify-center items-center text-center shadow-inner">
                <div className="text-red-500/70 text-xs mb-1 font-bold tracking-widest">STATUS</div>
                <div className="text-red-500 font-bold tracking-widest uppercase animate-pulse">
                  {clueRevealed ? 'MISSION ACTIVE' : 'SYSTEM LOCKED'}
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-green-500/30 p-4 rounded-xl flex flex-col justify-center items-center text-center shadow-inner">
                <div className="text-green-500/70 text-xs mb-1 font-bold tracking-widest">TIME REMAINING</div>
                <div className="text-2xl text-green-400 font-bold tracking-widest drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">60:00</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <button 
              onClick={handleScanQR}
              disabled={clueRevealed || scanning}
              className={`bg-zinc-900/40 border border-green-500/20 p-6 rounded-xl flex flex-col items-center justify-center relative aspect-square backdrop-blur-sm transition-all duration-300
                ${(clueRevealed || scanning) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500/10 hover:border-green-500/50 cursor-pointer group'}
              `}
            >
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-green-500/50"></div>
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-green-500/50"></div>
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-green-500/50"></div>
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-green-500/50"></div>
              
              <QrCode className={`w-32 h-32 mb-4 transition-all duration-500 
                ${scanning ? 'text-green-400 animate-pulse scale-110' : clueRevealed ? 'text-green-500/10' : 'text-green-500/40 group-hover:text-green-400 group-hover:scale-105'}`} 
                strokeWidth={0.5} 
              />
              <div className="text-xs text-center text-green-500/50 tracking-widest uppercase font-bold">
                {scanning ? 'SCANNING...' : clueRevealed ? 'SCANNED' : 'CLICK TO SCAN QR'}
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
