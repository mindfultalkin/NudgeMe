import { useState } from 'react';
import { CHANNEL_ICONS } from '../../utils/constants';
import { wordCount, topicKey, formatDate } from '../../utils/helpers';
import { generateNudge, sendNudge } from '../../services/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateWithRetry = async (topic, coacheeName, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const nudge = await generateNudge(topic, coacheeName);
      if (nudge && !nudge.includes('Error')) return nudge;
      throw new Error('Empty nudge');
    } catch (e) {
      if (attempt < retries) {
        await sleep(attempt * 2000);
      } else {
        throw e;
      }
    }
  }
};

export default function MobNudges({ coachees, topics }) {
  const [nudges, setNudges] = useState({});
  const [loadingKey, setLoadingKey] = useState(null);
  const [sending, setSending] = useState({});
  const [channel, setChannel] = useState({});
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);
  const [allGenerating, setAllGenerating] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const names = ['ALL', ...Array.from(new Set(coachees.map((c) => c.coacheeName)))];
  const filtered = filter === 'ALL' ? topics : topics.filter((t) => t.coacheeName === filter);

  const handleGenerate = async (t) => {
    const key = topicKey(t);
    setLoadingKey(key);
    setExpanded(key);
    try {
      const nudge = await generateWithRetry(t.topic, t.coacheeName);
      setNudges((p) => ({ ...p, [key]: nudge }));
    } catch (e) {
      setNudges((p) => ({ ...p, [key]: '⚠ Failed. Tap to retry.' }));
    }
    setLoadingKey(null);
  };

  const handleGenerateAll = async () => {
    setAllGenerating(true);
    setProgress({ current: 0, total: filtered.length });
    for (let i = 0; i < filtered.length; i++) {
      const t = filtered[i];
      const key = topicKey(t);
      setLoadingKey(key);
      setProgress({ current: i + 1, total: filtered.length });
      try {
        const nudge = await generateWithRetry(t.topic, t.coacheeName);
        setNudges((p) => ({ ...p, [key]: nudge }));
      } catch (e) {
        setNudges((p) => ({ ...p, [key]: '⚠ Failed.' }));
      }
      await sleep(2000);
    }
    setLoadingKey(null);
    setAllGenerating(false);
    setProgress({ current: 0, total: 0 });
  };

  const handleSend = async (t) => {
    const key = topicKey(t);
    const nudge = nudges[key];
    if (!nudge) return;

    const ch = channel[key] || 'Email';
    const coachee = coachees.find((c) => c.coacheeName === t.coacheeName);
    const destination = ch === 'Email' ? coachee?.email : coachee?.phone;

    setSending((p) => ({ ...p, [key]: true }));
    try {
      const res = await sendNudge({
        coacheeName: t.coacheeName,
        topic: t.topic,
        nudge,
        channel: ch,
        destination,
        coach: t.coach,
      });
      if (res.success) {
        setNudges((p) => ({ ...p, [key + '::sent']: true }));
        setExpanded(null);
      } else {
        alert(`Failed: ${res.error}`);
      }
    } catch (err) {
      alert(`Server error: ${err.message}`);
    }
    setSending((p) => ({ ...p, [key]: false }));
  };

  return (
    <div className="p-4">
      <div className="text-2xl font-display text-primary-light mb-4">Nudge Dashboard</div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {names.map((name) => (
          <button
            key={name}
            onClick={() => setFilter(name)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium cursor-pointer font-sans transition-colors ${
              filter === name
                ? 'bg-primary text-primary-dark border border-primary'
                : 'bg-surface-card text-gray-500 border border-surface-cardBorder'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerateAll}
        disabled={allGenerating}
        className={`w-full rounded-lg py-3 text-sm font-semibold mb-2 font-sans transition-colors ${
          allGenerating ? 'bg-surface-card text-gray-500' : 'bg-primary text-primary-dark'
        }`}
      >
        {allGenerating
          ? `Generating ${progress.current} / ${progress.total}...`
          : `Generate All (${filtered.length})`}
      </button>

      {allGenerating && (
        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
          />
        </div>
      )}

      {filtered.map((t) => {
        const key = topicKey(t);
        const nudge = nudges[key];
        const isLoading = loadingKey === key;
        const isSent = nudges[key + '::sent'];
        const isExpanded = expanded === key;
        const ch = channel[key] || 'Email';
        const words = wordCount(nudge);

        return (
          <div
            key={key}
            onClick={() => !isLoading && setExpanded(isExpanded ? null : key)}
            className={`bg-surface-card border rounded-xl p-4 mb-3 cursor-pointer transition-opacity ${
              isSent ? 'border-l-2 border-success opacity-65'
                : nudge ? 'border-l-2 border-primary'
                : 'border-l-2 border-surface-cardBorder'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-2">
                {t.date && <div className="text-xs text-gray-500 mb-1">{formatDate(t.date)}</div>}
                <div className="font-semibold text-primary-light text-base leading-tight">{t.topic}</div>
                <div className="text-xs text-gray-500 mt-1">{t.coacheeName} · {t.coach}</div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {isSent && <span className="bg-green-900/20 text-green-500 rounded-full px-2 py-0.5 text-xs">✓ Sent</span>}
                {nudge && !isSent && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${words > 20 ? 'bg-red-900/20 text-red-500' : 'bg-green-900/20 text-green-500'}`}>
                    {words}w
                  </span>
                )}
                <span className="text-gray-600 text-sm">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {nudge && !isExpanded && (
              <div className="mt-2 italic text-sm text-gray-500 border-l-2 border-surface-cardBorder pl-2 leading-relaxed">
                {nudge.length > 85 ? nudge.substring(0, 85) + '…' : nudge}
              </div>
            )}

            {isExpanded && (
              <div onClick={(e) => e.stopPropagation()} className="mt-4 border-t border-surface-cardBorder pt-4">
                {isLoading ? (
                  <div className="text-gray-500 italic text-center text-sm">Generating...</div>
                ) : nudge ? (
                  <>
                    {editingKey === key ? (
                      <div className="mb-3">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          className="w-full bg-surface-cardBorder border border-surface-cardBorder rounded-lg px-3 py-2 text-primary-light text-sm font-sans outline-none"
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => { setNudges((p) => ({ ...p, [key]: editValue })); setEditingKey(null); }}
                            className="flex-1 bg-primary text-primary-dark rounded-lg py-2 text-sm font-medium">Save</button>
                          <button onClick={() => setEditingKey(null)}
                            className="flex-1 bg-surface-card text-gray-500 rounded-lg py-2 text-sm font-medium">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="italic text-sm text-gray-200 border-l-2 border-primary pl-3 leading-relaxed mb-3">{nudge}</div>
                    )}

                    {!isSent && editingKey !== key && (
                      <>
                        <div className="flex gap-2 mb-3">
                          {['Email', 'WhatsApp'].map((c) => (
                            <button key={c} onClick={() => setChannel((p) => ({ ...p, [key]: c }))}
                              className={`flex-1 rounded-lg py-2 text-sm cursor-pointer font-sans transition-colors ${
                                (channel[key] || 'Email') === c
                                  ? 'bg-green-900/20 text-green-500 border border-green-800'
                                  : 'bg-surface-card text-gray-500 border border-surface-cardBorder'
                              }`}>
                              {CHANNEL_ICONS[c]} {c}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleGenerate(t)}
                            className="flex-1 bg-surface-card text-gray-500 rounded-lg py-2 text-sm font-medium">↺ Regen</button>
                          <button onClick={() => { setEditingKey(key); setEditValue(nudge); }}
                            className="flex-1 bg-surface-card text-gray-500 rounded-lg py-2 text-sm font-medium">Edit</button>
                          <button onClick={() => navigator.clipboard.writeText(nudge)}
                            className="flex-1 bg-surface-card text-gray-500 rounded-lg py-2 text-sm font-medium">Copy</button>
                          <button onClick={() => handleSend(t)} disabled={sending[key]}
                            className={`flex-2 bg-primary text-primary-dark rounded-lg py-2 text-sm font-semibold ${sending[key] ? 'opacity-60' : ''}`}>
                            {sending[key] ? 'Sending...' : `Send ${CHANNEL_ICONS[ch]}`}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <button onClick={() => handleGenerate(t)}
                    className="w-full bg-primary text-primary-dark rounded-lg py-3 text-sm font-semibold">
                    Generate Nudge
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}