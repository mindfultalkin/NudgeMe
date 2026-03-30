import { useState } from 'react';
import { formatDateShort } from '../../utils/helpers';
import { queueNudge, updateSchedule } from '../../services/api';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const TIME_OPTIONS = [];
for (let h = 6; h <= 22; h++) {
  for (let m of [0, 30]) {
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ap = h >= 12 ? 'PM' : 'AM';
    TIME_OPTIONS.push({ label: `${h12}:${m === 0 ? '00' : '30'} ${ap}`, value: `${String(h).padStart(2,'0')}:${m===0?'00':'30'}` });
  }
}
const timeLabel = v => TIME_OPTIONS.find(t => t.value === v)?.label || v;

export default function CoacheesTab({ coachees, topics, schedule, onScheduleUpdate }) {
  const [selected, setSelected]     = useState(coachees[0]?.coacheeName || '');
  const [localSchedule, setLocal]   = useState(schedule);
  const [saving, setSaving]         = useState(false);
  const [saveOk, setSaveOk]         = useState(false);
  const [queueing, setQueueing]     = useState(false);
  const [queued, setQueued]         = useState({});
  const [bulkChannel, setBCh]       = useState('WhatsApp');
  const [bulkFreq, setBFreq]        = useState('daily');
  const [bulkTime, setBTime]        = useState('09:00');
  const [bulkDay, setBDay]          = useState('monday');
  const [bulkSaving, setBSaving]    = useState(false);
  const [bulkOk, setBOk]            = useState(false);

  const coachee = coachees.find(c => c.coacheeName === selected);
  const coacheeTopics = topics.filter(t => t.coacheeName === selected);
  const activeCount = localSchedule.filter(s => s.active).length;

  const getEntry = (name) => localSchedule.find(s => s.coacheeName === name) || {
    coacheeName: name, active: false, channel: 'Email', frequency: 'daily',
    sendTime: '09:00', sendDay: 'monday',
    email: coachees.find(c=>c.coacheeName===name)?.email || '',
    phone: coachees.find(c=>c.coacheeName===name)?.phone || '',
    topics: topics.filter(t=>t.coacheeName===name).map(t=>t.topic),
    lastTopicIndex: -1,
  };

  const updateField = (field, value) => {
    setLocal(prev => {
      const exists = prev.find(s => s.coacheeName === selected);
      if (exists) return prev.map(s => s.coacheeName === selected ? { ...s, [field]: value } : s);
      return [...prev, { ...getEntry(selected), [field]: value }];
    });
  };

  const handleSave = async () => {
    setSaving(true); setSaveOk(false);
    let final = localSchedule;
    if (!localSchedule.find(s => s.coacheeName === selected)) {
      final = [...localSchedule, getEntry(selected)];
      setLocal(final);
    }
    await updateSchedule(final);
    onScheduleUpdate(final);
    setSaving(false); setSaveOk(true);
    setTimeout(() => setSaveOk(false), 2000);
  };

  const handleScheduleAll = async () => {
    setBSaving(true); setBOk(false);
    const updated = coachees.map(c => {
      const ex = localSchedule.find(s => s.coacheeName === c.coacheeName);
      return { ...(ex||{}), coacheeName: c.coacheeName, coach: c.coach, email: c.email, phone: c.phone,
        topics: topics.filter(t=>t.coacheeName===c.coacheeName).map(t=>t.topic),
        channel: bulkChannel, frequency: bulkFreq, sendTime: bulkTime, sendDay: bulkDay,
        active: true, lastTopicIndex: ex?.lastTopicIndex ?? -1 };
    });
    setLocal(updated);
    await updateSchedule(updated);
    onScheduleUpdate(updated);
    setBSaving(false); setBOk(true);
    setTimeout(() => setBOk(false), 2500);
  };

  const handleQueueNudge = async (topic) => {
    if (!coachee) return;
    setQueueing(topic);
    try {
      const entry = getEntry(selected);
      await queueNudge({ coacheeName: coachee.coacheeName, coach: coachee.coach, topic,
        channel: entry.channel || 'Email', email: coachee.email, phone: coachee.phone });
      setQueued(p => ({ ...p, [topic]: true }));
    } catch(e) { console.error(e); }
    setQueueing(false);
  };

  const currentEntry = getEntry(selected);

  const selectClass = "w-full border-none bg-surface-container-high rounded-lg text-sm font-semibold p-3 focus:ring-2 focus:ring-primary/10";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero */}
      <section className="max-w-3xl mb-10">
        <h2 className="font-serif text-4xl text-on-surface mb-2">Refine the Journey</h2>
        <p className="text-on-surface-variant text-lg italic opacity-80">
          Apply global rhythms or fine-tune individual coaching frequencies for your cohort.
        </p>
      </section>

      {/* Bulk schedule */}
      <section className="bg-surface-container-low p-8 rounded-3xl mb-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-fixed-dim block mb-2">Global Configuration</span>
            <h3 className="font-serif text-2xl">Bulk Schedule Pulse</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${activeCount > 0 ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container text-outline'}`}>
              {activeCount}/{coachees.length} active
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-surface-container-lowest p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-sm">hub</span>
              <span className="text-xs font-bold uppercase">Channel</span>
            </div>
            <select value={bulkChannel} onChange={e => setBCh(e.target.value)} className={selectClass}>
              <option>WhatsApp</option><option>Email</option>
            </select>
          </div>
          <div className="bg-surface-container-lowest p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-sm">event_repeat</span>
              <span className="text-xs font-bold uppercase">Frequency</span>
            </div>
            <select value={bulkFreq} onChange={e => setBFreq(e.target.value)} className={selectClass}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="bg-surface-container-lowest p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span className="text-xs font-bold uppercase">Send Time</span>
            </div>
            <select value={bulkTime} onChange={e => setBTime(e.target.value)} className={selectClass}>
              {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {bulkFreq === 'weekly' && (
            <div className="bg-surface-container-lowest p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-tertiary">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <span className="text-xs font-bold uppercase">Day</span>
              </div>
              <select value={bulkDay} onChange={e => setBDay(e.target.value)} className={selectClass}>
                {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center justify-center bg-surface-container-lowest rounded-2xl p-4">
            <button onClick={handleScheduleAll} disabled={bulkSaving}
              className="w-full h-full py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold flex flex-col items-center justify-center gap-1 shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-60">
              <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings:"'FILL' 1"}}>bolt</span>
              <span className="text-sm">{bulkSaving ? 'Applying...' : 'Apply to All'}</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-outline italic">
          All {coachees.length} coachees will receive nudges {bulkFreq === 'daily' ? `daily at ${timeLabel(bulkTime)}` : `every ${bulkDay} at ${timeLabel(bulkTime)}`}, rotating through their own topics.
          {bulkOk && <span className="ml-3 text-green-600 font-bold">✓ Applied!</span>}
        </p>
      </section>

      {/* Split view */}
      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar */}
        <section className="col-span-12 lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="font-serif text-xl">Directory</h4>
            <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-outline">{coachees.length} MEMBERS</span>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {coachees.map(c => {
              const entry = localSchedule.find(s => s.coacheeName === c.coacheeName);
              const isActive = entry?.active;
              const isSel = selected === c.coacheeName;
              return (
                <div key={c.coacheeName} onClick={() => { setSelected(c.coacheeName); setQueued({}); }}
                  className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${
                    isSel ? 'bg-surface-container-lowest shadow-sm border-l-4 border-primary' : 'bg-surface-container-low/50 hover:bg-surface-container-low'
                  } ${!isActive && !isSel ? 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100' : ''}`}>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">{c.coacheeName}</p>
                    <p className="text-xs text-outline">{c.program}</p>
                    {entry && <p className="text-[10px] text-on-surface-variant mt-0.5">{timeLabel(entry.sendTime)} · {entry.frequency} · {entry.channel}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    isActive ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-high text-outline'
                  }`}>{isActive ? 'Active' : 'Paused'}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detail */}
        {coachee && (
          <section className="col-span-12 lg:col-span-8 space-y-6">
            {/* Profile header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-3xl">{coachee.coacheeName}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-outline">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">mail</span>{coachee.email}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">phone</span>{coachee.phone}</span>
                  <span>·</span>
                  <span className="text-tertiary font-bold uppercase">{coachee.program}</span>
                </div>
              </div>
            </div>

            {/* Schedule controls */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-3">Frequency & Pacing</label>
                  <div className="bg-surface-container-low p-1.5 rounded-2xl flex gap-1">
                    {['daily','weekly'].map(f => (
                      <button key={f} onClick={() => updateField('frequency', f)}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-colors ${
                          currentEntry.frequency === f ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:bg-white/50'
                        }`}>
                        {f.charAt(0).toUpperCase()+f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-surface-container-low p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Channel</span>
                    <div className="flex bg-surface-container-high p-1 rounded-lg gap-1">
                      {['WhatsApp','Email'].map(c => (
                        <button key={c} onClick={() => updateField('channel', c)}
                          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${currentEntry.channel===c ? 'bg-white shadow-sm text-primary' : 'text-outline'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Send Time</span>
                    <select value={currentEntry.sendTime||'09:00'} onChange={e => updateField('sendTime', e.target.value)}
                      className="text-sm font-medium bg-white px-3 py-1.5 rounded-lg shadow-sm border-none focus:ring-1 focus:ring-primary/20">
                      {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  {currentEntry.frequency === 'weekly' && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">Send Day</span>
                      <select value={currentEntry.sendDay||'monday'} onChange={e => updateField('sendDay', e.target.value)}
                        className="text-sm font-medium bg-white px-3 py-1.5 rounded-lg shadow-sm border-none focus:ring-1 focus:ring-primary/20">
                        {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Status</span>
                    <button onClick={() => updateField('active', !currentEntry.active)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        currentEntry.active ? 'bg-green-100 text-green-700' : 'bg-surface-container text-outline'
                      }`}>
                      {currentEntry.active ? '● Active' : '○ Paused'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Topics */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase text-slate-400">Coaching Topics ({coacheeTopics.length})</label>
                </div>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {coacheeTopics.map((t, i) => {
                    const isNext = (currentEntry.lastTopicIndex + 1) % coacheeTopics.length === i;
                    return (
                      <div key={t.topic} className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/10 group hover:translate-x-1 transition-transform">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-serif text-base">{t.topic}</h5>
                          {isNext && currentEntry.active
                            ? <span className="bg-tertiary-container text-on-tertiary-container text-[10px] font-bold px-2 py-0.5 rounded uppercase">Next</span>
                            : <span className="text-[10px] text-outline">{t.date ? formatDateShort(t.date) : ''}</span>
                          }
                        </div>
                        <div className="flex items-center justify-between">
                          {queued[t.topic]
                            ? <span className="text-xs text-green-600 font-bold">✓ Queued</span>
                            : <button onClick={() => handleQueueNudge(t.topic)} disabled={queueing === t.topic}
                                className="opacity-0 group-hover:opacity-100 bg-primary text-on-primary px-3 py-1 rounded-lg text-[10px] font-bold transition-opacity disabled:opacity-50">
                                {queueing === t.topic ? 'Queuing...' : 'Queue Nudge'}
                              </button>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="bg-white p-6 rounded-3xl shadow-sm flex items-center justify-between">
              <div className="flex gap-10">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Topics</p>
                  <p className="font-serif text-3xl">{coacheeTopics.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Schedule</p>
                  <p className="font-serif text-lg">{currentEntry.active ? `${currentEntry.frequency} · ${timeLabel(currentEntry.sendTime||'09:00')}` : 'Paused'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {saveOk && <span className="text-green-600 text-sm font-bold">✓ Saved</span>}
                <button onClick={handleSave} disabled={saving}
                  className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container rounded-2xl text-on-primary font-bold shadow-xl hover:shadow-primary/20 active:scale-95 transition-all disabled:opacity-60">
                  {saving ? 'Saving...' : `Save ${coachee.coacheeName}'s Schedule`}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}