import { useState, useEffect } from 'react';
import { ShieldAlert, Database, Users, Map, FileSearch, Trash2, Edit, Save, Plus, Play, RotateCcw, XCircle } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('teams');
  const [teams, setTeams] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for editing
  const [editingCheckpoint, setEditingCheckpoint] = useState(null);
  const [cpFormData, setCpFormData] = useState({});
  const [editingEvidence, setEditingEvidence] = useState(null);
  const [evFormData, setEvFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, cRes, eRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/teams'),
        fetch('http://localhost:8000/api/admin/checkpoints'),
        fetch('http://localhost:8000/api/admin/evidence')
      ]);
      setTeams(await tRes.json());
      setCheckpoints(await cRes.json());
      setEvidence(await eRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetTestTeam = async (teamId) => {
    if (!window.confirm("This will completely reset this team's progress. Continue?")) return;
    try {
      await fetch(`http://localhost:8000/api/admin/test/reset/${teamId}`, { method: 'POST' });
      fetchData();
      alert("Team reset successfully.");
    } catch (err) {
      alert("Failed to reset team.");
    }
  };

  const saveCheckpoint = async () => {
    try {
      await fetch(`http://localhost:8000/api/admin/checkpoints/${editingCheckpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cpFormData)
      });
      setEditingCheckpoint(null);
      fetchData();
    } catch (err) {
      alert("Save failed");
    }
  };

  const saveEvidence = async () => {
    try {
      await fetch(`http://localhost:8000/api/admin/evidence/${editingEvidence}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evFormData)
      });
      setEditingEvidence(null);
      fetchData();
    } catch (err) {
      alert("Save failed");
    }
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 text-red-500 p-8 font-mono">LOADING ADMIN MODULE...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono flex">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-red-500/30 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10 text-red-500">
          <ShieldAlert className="w-8 h-8" />
          <h1 className="font-bold tracking-widest text-lg">SYS_ADMIN</h1>
        </div>
        
        <nav className="flex flex-col gap-2 flex-grow">
          <button onClick={() => setActiveTab('teams')} className={`p-3 flex items-center gap-3 text-left rounded transition-colors ${activeTab === 'teams' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-zinc-400 hover:bg-zinc-800'}`}>
            <Users className="w-5 h-5" /> Teams (DEMO)
          </button>
          <button onClick={() => setActiveTab('checkpoints')} className={`p-3 flex items-center gap-3 text-left rounded transition-colors ${activeTab === 'checkpoints' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-zinc-400 hover:bg-zinc-800'}`}>
            <Map className="w-5 h-5" /> Checkpoints
          </button>
          <button onClick={() => setActiveTab('evidence')} className={`p-3 flex items-center gap-3 text-left rounded transition-colors ${activeTab === 'evidence' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-zinc-400 hover:bg-zinc-800'}`}>
            <FileSearch className="w-5 h-5" /> Evidence
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-8 border-b border-zinc-800 pb-4 flex items-center gap-3">
          <Database className="text-red-500" />
          {activeTab.toUpperCase()} CONFIGURATION
        </h2>

        {/* TEAMS TAB */}
        {activeTab === 'teams' && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <p className="text-sm text-yellow-500 mb-6 bg-yellow-500/10 p-4 rounded inline-block">
              WARNING: Production team management should be done via secure CLI or imported. This view is for testing and resets.
            </p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="p-3">ID</th>
                  <th className="p-3">NAME</th>
                  <th className="p-3">SEQUENCE</th>
                  <th className="p-3">SCORE</th>
                  <th className="p-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {teams.map(team => (
                  <tr key={team.id}>
                    <td className="p-3 text-zinc-400 text-xs">{team.team_code}</td>
                    <td className="p-3 font-bold">{team.name}</td>
                    <td className="p-3 text-red-400">{team.current_checkpoint_sequence}</td>
                    <td className="p-3">{team.score}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => resetTestTeam(team.id)} className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded border border-orange-500/30 hover:bg-orange-500/20 text-xs flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> RESET
                      </button>
                      <button onClick={() => window.open('/', '_blank')} className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded border border-blue-500/30 hover:bg-blue-500/20 text-xs flex items-center gap-1">
                        <Play className="w-3 h-3" /> TEST
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CHECKPOINTS TAB */}
        {activeTab === 'checkpoints' && (
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <button onClick={async () => {
                const newCp = {
                  title: "New Checkpoint",
                  description: "Enter description here",
                  type: "logic",
                  puzzle_data: {},
                  hint_text: "Hint here",
                  is_enabled: false,
                  answer_hash: "default"
                };
                await fetch('http://localhost:8000/api/admin/checkpoints', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newCp)
                });
                window.location.reload();
              }} className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded font-bold text-sm">
                + ADD CHECKPOINT
              </button>
            </div>
            {checkpoints.map(cp => (
              <div key={cp.sequence} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-red-500 font-bold mb-1">NODE {cp.sequence} <span className="text-zinc-500 font-normal">| TYPE: {cp.type}</span></div>
                    <h3 className="text-xl font-bold mb-4">{cp.title}</h3>
                  </div>
                  <button onClick={() => {
                    setEditingCheckpoint(cp.sequence);
                    setCpFormData({
                      title: cp.title,
                      description: cp.description,
                      type: cp.type,
                      puzzle_data: cp.puzzle_data,
                      hint_text: cp.hint_text,
                      answer_hash: '', // We don't load the hash back, just allow overwrite
                      is_enabled: cp.is_enabled ?? true,
                      location_clue: cp.location_clue ?? '',
                      qr_activation_code: cp.qr_activation_code ?? ''
                    });
                  }} className="text-zinc-500 hover:text-white p-2">
                    <Edit className="w-5 h-5" />
                  </button>
                </div>

                {editingCheckpoint === cp.sequence ? (
                  <div className="mt-4 space-y-4 bg-black p-6 rounded-lg border border-red-500/30">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">TITLE</label>
                      <input type="text" value={cpFormData.title} onChange={e => setCpFormData({...cpFormData, title: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">DESCRIPTION / INSTRUCTION</label>
                      <textarea value={cpFormData.description} onChange={e => setCpFormData({...cpFormData, description: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm h-24" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">HINT TEXT</label>
                      <input type="text" value={cpFormData.hint_text} onChange={e => setCpFormData({...cpFormData, hint_text: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">NEW ANSWER (Leave blank to keep current hash)</label>
                      <input type="text" value={cpFormData.answer_hash} onChange={e => setCpFormData({...cpFormData, answer_hash: e.target.value ? e.target.value.toLowerCase().trim() : ''})} placeholder="Plaintext answer..." className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm" />
                      <p className="text-xs text-orange-500 mt-1">If changed, this will automatically be SHA-256 hashed on the backend.</p>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">LOCATION CLUE (For Transit)</label>
                      <input type="text" value={cpFormData.location_clue} onChange={e => setCpFormData({...cpFormData, location_clue: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">QR ACTIVATION CODE</label>
                      <input type="text" value={cpFormData.qr_activation_code} onChange={e => setCpFormData({...cpFormData, qr_activation_code: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id={`enabled-${cp.sequence}`} checked={cpFormData.is_enabled} onChange={e => setCpFormData({...cpFormData, is_enabled: e.target.checked})} className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded" />
                      <label htmlFor={`enabled-${cp.sequence}`} className="text-sm font-bold text-zinc-300">ENABLE CHECKPOINT</label>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">PUZZLE DATA CONFIG (JSON)</label>
                      <textarea value={JSON.stringify(cpFormData.puzzle_data, null, 2)} onChange={e => {
                        try {
                          setCpFormData({...cpFormData, puzzle_data: JSON.parse(e.target.value)});
                        } catch(err) {
                          // Invalid JSON, ignore until valid
                        }
                      }} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm font-mono h-48" />
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                      <button onClick={async () => {
                        if(window.confirm('Delete this checkpoint?')) {
                          await fetch(`http://localhost:8000/api/admin/checkpoints/${cp.sequence}`, { method: 'DELETE' });
                          window.location.reload();
                        }
                      }} className="mr-auto px-4 py-2 bg-red-900/50 text-red-500 font-bold rounded hover:bg-red-900 text-sm">DELETE</button>
                      <button onClick={() => setEditingCheckpoint(null)} className="px-4 py-2 border border-zinc-700 rounded hover:bg-zinc-800 text-sm">CANCEL</button>
                      <button onClick={saveCheckpoint} className="px-4 py-2 bg-red-500 text-black font-bold rounded hover:bg-red-400 text-sm flex items-center gap-2"><Save className="w-4 h-4"/> SAVE CHANGES</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-400 text-sm grid grid-cols-2 gap-4">
                    <div className="bg-black p-3 rounded">
                      <strong className="text-zinc-500 block mb-1">INSTRUCTION:</strong>
                      <div className="line-clamp-2">{cp.description}</div>
                    </div>
                    <div className="bg-black p-3 rounded">
                      <strong className="text-zinc-500 block mb-1">CONFIG:</strong>
                      <pre className="text-xs text-green-500 line-clamp-3">{JSON.stringify(cp.puzzle_data, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'evidence' && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="flex justify-end mb-4">
              <button onClick={async () => {
                const newEv = {
                  checkpoint_sequence: evidence.length + 1,
                  piece_data: "NEW EVIDENCE"
                };
                await fetch('http://localhost:8000/api/admin/evidence', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newEv)
                });
                window.location.reload();
              }} className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded font-bold text-sm">
                + ADD EVIDENCE
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="p-3">AWARDED AT CHECKPOINT</th>
                  <th className="p-3">EVIDENCE DATA</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {evidence.map(ev => (
                  <tr key={ev.checkpoint_sequence}>
                    <td className="p-3 font-bold text-red-400">NODE {ev.checkpoint_sequence}</td>
                    <td className="p-3">
                      {editingEvidence === ev.checkpoint_sequence ? (
                        <input 
                          type="text" 
                          value={evFormData.piece_data} 
                          onChange={e => setEvFormData({piece_data: e.target.value})}
                          className="w-full bg-black border border-red-500/50 rounded px-3 py-1 outline-none focus:border-red-500"
                        />
                      ) : (
                        <span className="font-mono text-lg">{ev.piece_data}</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {editingEvidence === ev.checkpoint_sequence ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingEvidence(null)} className="text-zinc-500 hover:text-white"><XCircle className="w-5 h-5"/></button>
                          <button onClick={saveEvidence} className="text-green-500 hover:text-green-400"><Save className="w-5 h-5"/></button>
                          <button onClick={async () => {
                            if(window.confirm('Delete this evidence?')) {
                              await fetch(`http://localhost:8000/api/admin/evidence/${ev.checkpoint_sequence}`, { method: 'DELETE' });
                              window.location.reload();
                            }
                          }} className="text-red-500 hover:text-red-400"><Trash2 className="w-5 h-5"/></button>
                        </div>
                      ) : (
                        <button onClick={() => {
                          setEditingEvidence(ev.checkpoint_sequence);
                          setEvFormData({piece_data: ev.piece_data});
                        }} className="text-zinc-500 hover:text-white p-1">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
