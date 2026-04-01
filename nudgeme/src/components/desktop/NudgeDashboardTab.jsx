import { useState } from 'react';
import { wordCount, topicKey, formatDate } from '../../utils/helpers';
import { generateNudge, sendNudge } from '../../services/api';
import { CHANNEL_ICONS } from '../../utils/constants';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const generateWithRetry = async (topic, coacheeName, retries = 3) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const n = await generateNudge(topic, coacheeName);
      if (n && !n.includes('Error')) return n;
      throw new Error('bad nudge');
    } catch(e) { if (i < retries) await sleep(i * 2000); else throw e; }
  }
};

export default function NudgeDashboardTab({ coachees, topics }) {
  const [nudges, setNudges]         = useState({});
  const [loadingTopic, setLoading]  = useState(null);
  const [allGenerating, setAllGen]  = useState(false);
  const [progress, setProgress]     = useState({ current: 0, total: 0 });
  const [channel, setChannel]       = useState({});
  const [sending, setSending]       = useState({});
  const [editing, setEditing]       = useState(null);
  const [editVal, setEditVal]       = useState('');
  const [copied, setCopied]         = useState(null);
  const [filter, setFilter]         = useState('ALL');
  const [searchTerm, setSearchTerm] = useState(''); // New search state

  // Get unique coachee names
  const coacheeNames = ['ALL', ...Array.from(new Set(coachees.map(c => c.coacheeName)))];
  
  // Filter by selected coachee AND search term
  const filteredTopics = filter === 'ALL' 
    ? topics.filter(t => t.coacheeName.toLowerCase().includes(searchTerm.toLowerCase()))
    : topics.filter(t => 
        t.coacheeName === filter && 
        t.coacheeName.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const handleGenerate = async (t) => {
    const key = topicKey(t);
    setLoading(key);
    try {
      const result = await generateWithRetry(t.topic, t.coacheeName);
      setNudges(p => ({ ...p, [key]: result }));
    } catch (e) {
      setNudges(p => ({ ...p, [key]: '⚠ Failed to generate.' }));
    }
    setLoading(null);
  };

  const handleGenerateAll = async () => {
    setAllGen(true); 
    setProgress({ current: 0, total: filteredTopics.length });
    for (let i = 0; i < filteredTopics.length; i++) {
      const t = filteredTopics[i]; 
      const key = topicKey(t);
      setLoading(key); 
      setProgress({ current: i+1, total: filteredTopics.length });
      try { 
        const n = await generateWithRetry(t.topic, t.coacheeName); 
        setNudges(p => ({ ...p, [key]: n })); 
      }
      catch(e) { 
        setNudges(p => ({ ...p, [key]: '⚠ Failed.' })); 
      }
      await sleep(2000);
    }
    setLoading(null); 
    setAllGen(false); 
    setProgress({ current: 0, total: 0 });
  };

  const handleSend = async (t) => {
    const key = topicKey(t); 
    const nudge = nudges[key]; 
    if (!nudge) return;
    const ch = channel[key] || 'Email';
    const coachee = coachees.find(c => c.coacheeName === t.coacheeName);
    const dest = ch === 'Email' ? coachee?.email : coachee?.phone;
    setSending(p => ({ ...p, [key]: true }));
    try {
      const res = await sendNudge({ 
        coacheeName: t.coacheeName, 
        topic: t.topic, 
        nudge, 
        channel: ch, 
        destination: dest, 
        coach: t.coach 
      });
      if (res.success) setNudges(p => ({ ...p, [key+'::sent']: true }));
      else alert(`Failed: ${res.error}`);
    } catch(e) { 
      alert(`Error: ${e.message}`); 
    }
    setSending(p => ({ ...p, [key]: false }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
        <div>
          <h1 className="font-serif text-5xl text-on-surface leading-tight mb-2">The Morning Dispatch</h1>
          <p className="text-lg text-on-surface-variant/80">Crafting personalised interventions for your active coachees.</p>
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-xl">
            {/* Filter Dropdown - EXACT SAME AS OLD UI */}
            <div className="px-3 py-2 bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">filter_list</span>
              <select 
                value={filter} 
                onChange={e => setFilter(e.target.value)}
                className="bg-transparent border-none text-sm font-semibold text-on-surface focus:ring-0 cursor-pointer"
              >
                {coacheeNames.map(n => (
                  <option key={n} value={n}>
                    {n === 'ALL' ? `All Coachees (${filteredTopics.length})` : `${n} (${topics.filter(t=>t.coacheeName===n).length})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="px-3 py-2 bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/10 flex items-center gap-2 flex-1">
              <span className="material-symbols-outlined text-outline text-sm">search</span>
              <input
                type="text"
                placeholder="Search coachees..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-sm text-on-surface focus:ring-0 outline-none flex-1 w-32"
              />
            </div>

            <button 
              onClick={handleGenerateAll} 
              disabled={allGenerating}
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              {allGenerating ? `${progress.current}/${progress.total}` : 'Bulk Generate'}
            </button>
          </div>
          {allGenerating && (
            <div className="w-full bg-surface-container rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress.total > 0 ? (progress.current/progress.total)*100 : 0}%` }} 
              />
            </div>
          )}
        </div>
      </section>

      {/* Empty state */}
      {filteredTopics.length === 0 && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-4xl text-outline-variant">search_off</span>
          <p className="mt-4 text-on-surface-variant italic">
            {searchTerm ? 'No coachees match your search.' : 'No topics found for this filter.'}
          </p>
        </div>
      )}

      {/* Cards grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
        {filteredTopics.map(t => {
          const key    = topicKey(t);
          const nudge  = nudges[key];
          const isLoad = loadingTopic === key;
          const isSent = nudges[key+'::sent'];
          const words  = wordCount(nudge);
          const ch     = channel[key] || 'Email';

          return (
            <div key={key} className={`group bg-surface-container-lowest rounded-3xl p-8 flex flex-col gap-5 shadow-sm hover:shadow-xl hover:shadow-on-surface/5 transition-all duration-500 ${isSent ? 'opacity-70' : ''}`}>
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-xl text-on-surface">{t.coacheeName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-bold text-on-surface-variant uppercase">{t.topic}</span>
                    {t.date && <span className="text-xs text-outline">{formatDate(t.date)}</span>}
                  </div>
                </div>
                {isSent
                  ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">✓ Sent</span>
                  : nudge && <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${words > 20 ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-on-primary-fixed'}`}>{words}w</span>
                }
              </div>

              {/* Nudge content */}
              {nudge ? (
                editing === key ? (
                  <div className="space-y-2">
                    <textarea 
                      value={editVal} 
                      onChange={e => setEditVal(e.target.value)} 
                      autoFocus
                      className="w-full bg-surface-container-high border-none rounded-xl text-sm p-4 focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none" 
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setNudges(p => ({ ...p, [key]: editVal })); setEditing(null); }}
                        className="flex-1 bg-primary text-on-primary py-2 rounded-xl text-sm font-bold"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditing(null)}
                        className="flex-1 bg-surface-container text-on-surface-variant py-2 rounded-xl text-sm font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface p-5 rounded-2xl border-l-4 border-primary/40 italic text-on-surface-variant leading-relaxed relative">
                    <span className="absolute -top-3 left-5 px-3 bg-surface-container-highest text-[10px] font-bold tracking-widest text-primary uppercase rounded-full">AI Generated</span>
                    "{nudge}"
                  </div>
                )
              ) : (
                <div className="bg-surface-container rounded-2xl p-6 flex items-center justify-center min-h-[80px]">
                  {isLoad
                    ? <div className="flex items-center gap-3 text-on-surface-variant">
                        <span className="material-symbols-outlined animate-spin text-primary">refresh</span> 
                        Generating...
                      </div>
                    : <p className="text-sm text-on-surface-variant italic">No nudge generated yet.</p>
                  }
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                  {nudge && !isSent && editing !== key && <>
                    <button 
                      onClick={() => { setEditing(key); setEditVal(nudge); }}
                      className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-outline" 
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button 
                      onClick={() => { 
                        navigator.clipboard.writeText(nudge); 
                        setCopied(key); 
                        setTimeout(()=>setCopied(null),1500); 
                      }}
                      className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-outline" 
                      title="Copy"
                    >
                      <span className="material-symbols-outlined text-sm">{copied===key ? 'check' : 'content_copy'}</span>
                    </button>
                  </>}
                </div>

                <div className="flex items-center gap-3">
                  {nudge && !isSent && (
                    <div className="flex bg-surface-container-low p-1 rounded-lg">
                      {['Email','WhatsApp'].map(c => (
                        <button 
                          key={c} 
                          onClick={() => setChannel(p => ({ ...p, [key]: c }))}
                          className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${ch===c ? 'bg-white shadow-sm text-primary' : 'text-outline'}`}
                        >
                          {c === 'Email' ? 'EMAIL' : 'WA'}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => nudge && !isSent ? handleSend(t) : handleGenerate(t)}
                    disabled={isLoad || allGenerating || sending[key]}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-60 ${
                      isSent ? 'bg-surface-container text-on-surface-variant cursor-default'
                      : nudge ? 'bg-on-surface text-surface hover:bg-primary'
                      : 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg'
                    }`}
                  >
                    {isLoad ? <><span className="material-symbols-outlined text-sm animate-spin">refresh</span> Generating</>
                    : sending[key] ? 'Sending...'
                    : isSent ? <><span className="material-symbols-outlined text-sm">check</span> Sent</>
                    : nudge ? <><span className="material-symbols-outlined text-sm">send</span> Send</>
                    : <><span className="material-symbols-outlined text-sm" style={{fontVariationSettings:"'FILL' 1"}}>auto_awesome</span> Generate</>
                    }
                  </button>
                  {nudge && !isSent && (
                    <button 
                      onClick={() => handleGenerate(t)} 
                      disabled={isLoad || allGenerating}
                      className="p-2 hover:bg-surface-container-high rounded-full text-outline transition-colors" 
                      title="Regenerate"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Guardrails footer */}
      <footer className="fixed bottom-6 left-72 right-8 bg-on-surface text-surface py-4 px-8 rounded-2xl flex items-center justify-between shadow-2xl z-40">
        <div className="flex items-center gap-6">
          <span className="material-symbols-outlined text-tertiary-fixed" style={{fontVariationSettings:"'FILL' 1"}}>gavel</span>
          <span className="text-xs font-bold uppercase tracking-widest text-surface/60">Active Guardrails</span>
          <div className="flex gap-6 border-l border-surface/10 pl-6 text-xs text-surface/70">
            <span>One sentence · Max 20 words</span>
            <span>No frameworks · No emotional language</span>
            <span>No session references · No new topics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}