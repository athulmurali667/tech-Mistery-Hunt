import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { GameContext } from '../context/GameContext';
import { ArrowLeft, Terminal, AlertTriangle, CheckCircle, HelpCircle, Map, ShieldAlert } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function Checkpoint() {
  const { id: sequenceId } = useParams();
  const sequence = parseInt(sequenceId);
  const [searchParams, setSearchParams] = useSearchParams();
  const { team, token, updateTeam } = useContext(GameContext);
  const navigate = useNavigate();
  const [evidence, setEvidence] = useState([]);
  
  const [checkpoint, setCheckpoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  
  const [hint, setHint] = useState(null);
  const [requestingHint, setRequestingHint] = useState(false);

  useEffect(() => {
    const fetchCheckpoint = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch(`http://localhost:8000/api/game/checkpoints/${sequence}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setCheckpoint(data);
          
          if (data.hint_text) {
             setHint(data.hint_text);
          }
          
          if (data.type === 'final_boss') {
            const evRes = await fetch('http://localhost:8000/api/game/evidence', { headers });
            if (evRes.ok) {
              const evData = await evRes.json();
              setEvidence(evData);
            }
          }
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchCheckpoint();
  }, [sequence, token, navigate]);

  useEffect(() => {
    const scanTarget = searchParams.get('scan');
    if (scanTarget && checkpoint) {
       setAnswer(scanTarget);
       setSearchParams({});
       // Small timeout to allow state to settle before submission
       setTimeout(() => {
          submitWithAnswer(scanTarget);
       }, 500);
    }
  }, [searchParams, checkpoint, setSearchParams]);

  const submitWithAnswer = async (ans) => {
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(`http://localhost:8000/api/game/checkpoints/${sequence}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer: ans }),
      });
      const data = await res.json();
      setResult(data);
      
      if (data.correct) {
        updateTeam({ score: team.score + 10 });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    submitWithAnswer(answer);
  };

  const handleActivation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(`http://localhost:8000/api/game/checkpoints/${sequence}/activate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qr_code: answer }),
      });
      const data = await res.json();
      if (data.activated) {
        window.location.reload(); // Reload to fetch the unlocked checkpoint
      } else {
        setResult({ correct: false, message: data.message });
      }
    } catch (err) {
      setResult({ correct: false, message: 'Connection failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestHint = async () => {
    if (!window.confirm("Using a hint will deduct 5 points. Proceed?")) return;
    
    setRequestingHint(true);
    try {
      const res = await fetch('http://localhost:8000/api/game/hints/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ checkpoint_sequence: sequence }),
      });
      const data = await res.json();
      if (res.ok) {
        setHint(data.hint);
        if (!data.already_used) {
          updateTeam({ 
            hints_remaining: data.hints_remaining,
            score: data.score
          });
        }
      } else {
        alert(data.detail || 'Failed to get hint');
      }
    } catch (err) {
      alert('Connection failed.');
    } finally {
      setRequestingHint(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 text-green-500 font-mono p-6 flex items-center justify-center animate-pulse">Decrypting data stream...</div>;
  if (!checkpoint) return null;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
      
      <div className="max-w-3xl mx-auto mt-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-zinc-500 hover:text-green-400 transition-colors font-mono mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> RETURN TO DIRECTORY
        </button>

        <div className="bg-zinc-900/50 border border-green-500/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.1)] backdrop-blur-sm relative">
          
          <div className="bg-green-500/10 border-b border-green-500/30 p-4 flex justify-between items-center relative z-10">
            <h2 className="text-xl font-bold text-green-400 font-mono tracking-wider flex items-center gap-3">
              <Terminal className="w-5 h-5 opacity-70" />
              NODE {checkpoint.sequence}: {checkpoint.title}
            </h2>
            <div className="text-green-500/60 font-mono text-sm uppercase bg-green-500/10 px-3 py-1 rounded-md border border-green-500/20">
              {checkpoint.type}
            </div>
          </div>

          <div className="p-8 relative z-10">
            <div className="prose prose-invert prose-green max-w-none mb-10 font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {checkpoint.description}
            </div>

            {checkpoint.type === 'caesar_cipher' && checkpoint.puzzle_data && (
              <div className="mb-10 bg-zinc-950 border border-green-500/20 rounded-xl p-6 text-center shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(34,197,94,0.05)_3px,rgba(34,197,94,0.05)_3px)] pointer-events-none" />
                <div className="text-sm text-green-500/50 mb-4 tracking-widest font-bold">ENCRYPTED PAYLOAD</div>
                <div className="text-4xl md:text-5xl text-red-500 font-bold tracking-[0.3em] font-mono break-all mb-6 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)] select-all">
                  {checkpoint.puzzle_data.encrypted_text}
                </div>
                {checkpoint.puzzle_data.shift !== undefined && (
                  <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full border border-green-500/30 text-sm font-bold tracking-widest">
                    <Terminal className="w-4 h-4" />
                    SHIFT PARAMETER: {checkpoint.puzzle_data.shift}
                  </div>
                )}
              </div>
            )}

            {checkpoint.type === 'qr_authenticity' && checkpoint.puzzle_data && checkpoint.puzzle_data.qrs && (
              <div className="mb-10 bg-zinc-950 border border-green-500/20 rounded-xl p-6 shadow-inner relative">
                <div className="text-sm text-green-500/50 mb-6 tracking-widest font-bold text-center">AUTHENTICITY SCAN REQUIRED</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {checkpoint.puzzle_data.qrs.map((qr) => (
                    <div key={qr.id} className="flex flex-col items-center bg-zinc-900/50 p-4 rounded-lg border border-green-500/10 hover:border-green-500/50 transition-colors">
                      <div className="bg-white p-2 rounded-md mb-4 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        <QRCode 
                          value={`${window.location.origin}/checkpoint/${sequence}?scan=${qr.id}`}
                          size={150}
                          level="H"
                        />
                      </div>
                      <div className="text-xs text-green-500/70 font-mono tracking-widest bg-zinc-950 px-3 py-1 rounded-full border border-green-500/20">
                        {qr.id}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center text-xs text-green-500/40">
                  Scan the correct QR using your device to verify authenticity, or input its ID below.
                </div>
              </div>
            )}

            {checkpoint.type === 'media_mystery' && checkpoint.puzzle_data && (
              <div className="mb-10 bg-zinc-950 border border-green-500/20 rounded-xl p-6 text-center shadow-inner relative overflow-hidden">
                <div className="text-sm text-green-500/50 mb-4 tracking-widest font-bold">INTERCEPTED MEDIA PAYLOAD</div>
                
                {checkpoint.puzzle_data.media_type === 'image' && (
                  <div className="flex justify-center max-w-full overflow-hidden rounded-lg border border-green-500/30 p-2 bg-zinc-900/50">
                    <img 
                      src={checkpoint.puzzle_data.media_url} 
                      alt="Mystery Evidence" 
                      className="max-h-[400px] object-contain rounded"
                    />
                  </div>
                )}

                {checkpoint.puzzle_data.media_type === 'audio' && (
                  <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-lg border border-green-500/30">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/30 animate-pulse">
                      <Terminal className="w-8 h-8 text-green-400" />
                    </div>
                    <audio 
                      controls 
                      src={checkpoint.puzzle_data.media_url}
                      className="w-full max-w-md filter invert hue-rotate-180 opacity-90"
                    >
                      Your browser does not support the audio element.
                    </audio>
                    <div className="text-xs text-green-500/50 mt-4 tracking-widest uppercase">AUDIO STREAM SECURED</div>
                  </div>
                )}
              </div>
            )}

            {checkpoint.type === 'mini_coding' && checkpoint.puzzle_data && checkpoint.puzzle_data.code && (
              <div className="mb-10 bg-[#0d1117] border border-green-500/30 rounded-xl overflow-hidden shadow-inner font-mono text-sm sm:text-base">
                <div className="bg-[#161b22] px-4 py-2 border-b border-green-500/30 flex items-center gap-2 text-green-500/70">
                  <Terminal className="w-4 h-4" />
                  script.{checkpoint.puzzle_data.language || 'py'}
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-zinc-300">
                    <code>{checkpoint.puzzle_data.code}</code>
                  </pre>
                </div>
                {checkpoint.puzzle_data.explanation && (
                  <div className="bg-zinc-900/50 px-4 py-3 border-t border-green-500/20 text-green-500/60 text-xs tracking-wide">
                    // {checkpoint.puzzle_data.explanation}
                  </div>
                )}
              </div>
            )}

            {checkpoint.type === 'physical' && (
              <div className="mb-10 bg-blue-900/10 border border-blue-500/30 rounded-xl p-8 text-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 mx-auto flex items-center justify-center mb-6 animate-pulse border border-blue-500/50">
                  <ShieldAlert className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl text-white font-bold mb-2">VOLUNTEER VERIFICATION REQUIRED</h3>
                <p className="text-blue-400/80 text-sm mb-6 max-w-md mx-auto">
                  Complete the physical challenge according to the instructions above. Once finished, a volunteer will verify your completion and authorize your clearance.
                </p>
                <div className="inline-block bg-black/50 border border-blue-500/30 text-blue-300 px-6 py-3 rounded-full text-sm font-mono tracking-widest shadow-inner">
                  AWAITING CLEARANCE...
                </div>
              </div>
            )}

            {checkpoint.type === 'final_boss' && (
              <div className="mb-10 bg-zinc-950 border border-purple-500/30 rounded-xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                <h3 className="text-xl text-purple-400 font-mono tracking-widest border-b border-purple-500/30 pb-3 mb-6">
                  // COLLECTED EVIDENCE
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {evidence.map(ev => (
                    <div key={ev.sequence} className="bg-black border border-purple-500/50 p-4 rounded-lg flex flex-col items-center justify-center gap-2 relative overflow-hidden group hover:border-purple-400 transition-colors">
                      <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/30"></div>
                      <div className="text-purple-500/50 text-xs font-bold tracking-widest">EVIDENCE {ev.sequence}</div>
                      <div className="text-purple-300 font-mono text-xl tracking-widest break-all text-center">
                        {ev.piece_data}
                      </div>
                    </div>
                  ))}
                  {evidence.length === 0 && (
                    <div className="col-span-full text-zinc-600 text-sm italic py-4 text-center">
                      No evidence pieces found...
                    </div>
                  )}
                </div>
                <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded text-sm text-purple-300 font-mono">
                  <strong className="text-purple-400">FINAL INSTRUCTION:</strong><br />
                  {checkpoint.description}
                </div>
              </div>
            )}

            {hint && (
              <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 font-mono text-sm animate-in fade-in slide-in-from-top-2">
                <span className="font-bold flex items-center gap-2 mb-2 text-yellow-500"><HelpCircle className="w-4 h-4" /> DECRYPTED HINT:</span>
                {hint}
              </div>
            )}

            {checkpoint.type === 'transit' && (
              <form onSubmit={handleActivation} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-emerald-500/80 mb-2 font-mono flex items-center gap-2">
                    <Map className="w-4 h-4 text-emerald-500" /> LOCATION_UNLOCKED
                  </label>
                  <p className="text-zinc-400 font-mono text-sm mb-4">You must physically reach the location and scan its QR code to activate the node.</p>
                  <input 
                    type="text" 
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-emerald-500/30 text-emerald-400 px-5 py-4 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono placeholder-zinc-700 shadow-inner"
                    placeholder="Scan QR or enter activation code..."
                    required
                  />
                </div>
                {result && (
                  <div className={`p-4 rounded-lg flex items-start gap-3 font-mono text-sm animate-in fade-in ${result.correct === false ? 'bg-red-500/10 border border-red-500/50 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400'}`}>
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold mb-1 tracking-wider">SYSTEM ALERT</div>
                      <div className="opacity-80">{result.message}</div>
                    </div>
                  </div>
                )}
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-4 px-4 rounded-lg transition-all font-mono tracking-wider flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                >
                  {submitting ? 'VERIFYING...' : 'ACTIVATE NODE'}
                </button>
              </form>
            )}

            {checkpoint.type !== 'physical' && checkpoint.type !== 'transit' && (
              <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-green-500/80 mb-2 font-mono flex items-center gap-2">
                  <span className="text-green-500 animate-pulse">&gt;</span> INPUT_SOLUTION
                </label>
                <input 
                  type="text" 
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-green-500/30 text-green-400 px-5 py-4 rounded-lg focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all font-mono placeholder-zinc-700 shadow-inner"
                  placeholder="Enter access code or answer..."
                  required
                />
              </div>

              {result && (
                <div className={`p-4 rounded-lg flex items-start gap-3 font-mono text-sm animate-in fade-in ${result.correct ? 'bg-green-500/10 border border-green-500/50 text-green-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'}`}>
                  {result.correct ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)] rounded-full" /> : <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                  <div>
                    <div className="font-bold mb-1 tracking-wider">{result.correct ? 'SUCCESS // ACCESS GRANTED' : 'ERROR // ACCESS DENIED'}</div>
                    <div className="opacity-80">{result.message}</div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button 
                  type="submit" 
                  disabled={submitting || (result && result.correct)}
                  className="flex-1 bg-green-500 hover:bg-green-400 text-zinc-950 font-bold py-4 px-4 rounded-lg transition-all font-mono tracking-wider flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]"
                >
                  {submitting ? 'PROCESSING...' : 'EXECUTE'}
                </button>
                
                {!hint && team.hints_remaining > 0 && (
                  <button 
                    type="button" 
                    onClick={handleRequestHint}
                    disabled={requestingHint}
                    className="px-6 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/50 rounded-lg font-mono transition-all disabled:opacity-50"
                    title="Cost: 5 Points"
                  >
                    {requestingHint ? '...' : 'GET HINT (-5 PTS)'}
                  </button>
                )}
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
