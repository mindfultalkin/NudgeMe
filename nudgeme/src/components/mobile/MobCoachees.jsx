import { useState } from 'react';
import { formatDateShort } from '../../utils/helpers';
import { queueNudge, updateSchedule } from '../../services/api';

export default function MobCoachees({ coachees, topics, schedule, onScheduleUpdate }) {
  const [selected, setSelected] = useState(coachees[0]?.coacheeName || '');
  const [view, setView] = useState('list');
  const [queueing, setQueueing] = useState(false);
  const [queued, setQueued] = useState({});
  const [localSchedule, setLocalSchedule] = useState(schedule);
  const [saving, setSaving] = useState(false);

  const coachee = coachees.find((c) => c.coacheeName === selected);
  const coacheeTopics = topics.filter((t) => t.coacheeName === selected);
  const schedEntry = localSchedule.find((s) => s.coacheeName === selected);

  const handleQueueNudge = async (topic) => {
    if (!coachee) return;
    setQueueing(topic);
    try {
      await queueNudge({
        coacheeName: coachee.coacheeName,
        coach: coachee.coach,
        topic,
        channel: schedEntry?.channel || 'Email',
        email: coachee.email,
        phone: coachee.phone,
      });
      setQueued((prev) => ({ ...prev, [topic]: true }));
    } catch (e) {
      console.error('Error queueing nudge:', e);
    }
    setQueueing(false);
  };

  const updateScheduleField = (field, value) => {
    setLocalSchedule((prev) =>
      prev.map((s) => (s.coacheeName === selected ? { ...s, [field]: value } : s))
    );
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    await updateSchedule(localSchedule);
    onScheduleUpdate(localSchedule);
    setSaving(false);
  };

  // Detail View
  if (view === 'detail' && coachee) {
    return (
      <div className="p-4">
        <button 
          onClick={() => setView('list')} 
          className="bg-none border-none text-primary cursor-pointer text-sm font-sans mb-4 flex items-center gap-1 p-0"
        >
          ‹ Back to coachees
        </button>

        {/* Coachee Details */}
        <div className="bg-surface-card border border-surface-cardBorder rounded-xl p-4 mb-4 border-l-2 border-primary">
          <div className="font-bold text-primary-light text-base mb-3">{coachee.coacheeName}</div>
          {[
            { l: 'Coach', v: coachee.coach },
            { l: 'Program', v: coachee.program },
            { l: 'Email', v: coachee.email },
            { l: 'Phone', v: coachee.phone },
          ].map((f) => (
            <div key={f.l} className="mb-2">
              <span className="text-xs tracking-widest uppercase text-gray-500">{f.l}: </span>
              <span className="text-sm text-gray-400">{f.v}</span>
            </div>
          ))}
        </div>

        {/* Schedule Settings */}
        {schedEntry && (
          <div className="bg-surface-card border border-surface-cardBorder rounded-xl p-4 mb-4">
            <div className="text-xs tracking-widest uppercase text-gray-500 mb-4">Schedule Settings</div>
            <div className="flex flex-col gap-4">
              {/* Channel */}
              <div>
                <div className="text-xs text-gray-500 mb-2">Delivery Channel</div>
                <div className="flex gap-2">
                  {['Email', 'WhatsApp'].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateScheduleField('channel', c)}
                      className={`flex-1 rounded-lg py-3 text-sm cursor-pointer font-sans transition-colors ${
                        schedEntry.channel === c
                          ? 'bg-green-900/20 text-green-500 border border-green-800'
                          : 'bg-surface-card text-gray-500 border border-surface-cardBorder'
                      }`}
                    >
                      {c === 'Email' ? '✉' : '💬'} {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <div className="text-xs text-gray-500 mb-2">Frequency</div>
                <div className="flex gap-2">
                  {['daily', 'weekly'].map((f) => (
                    <button
                      key={f}
                      onClick={() => updateScheduleField('frequency', f)}
                      className={`flex-1 rounded-lg py-3 text-sm cursor-pointer font-sans transition-colors ${
                        schedEntry.frequency === f
                          ? 'bg-indigo-900/20 text-indigo-400 border border-indigo-800'
                          : 'bg-surface-card text-gray-500 border border-surface-cardBorder'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active & Save */}
              <div className="flex gap-2">
                <button
                  onClick={() => updateScheduleField('active', !schedEntry.active)}
                  className={`flex-1 rounded-lg py-3 text-sm font-medium transition-colors ${
                    schedEntry.active
                      ? 'bg-green-900/20 text-green-500 border border-green-800'
                      : 'bg-surface-card text-gray-500 border border-surface-cardBorder'
                  }`}
                >
                  {schedEntry.active ? '● Active' : '○ Paused'}
                </button>
                <button
                  onClick={handleSaveSchedule}
                  disabled={saving}
                  className="flex-1 bg-primary text-primary-dark rounded-lg py-3 text-sm font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Topics */}
        <div className="bg-surface-card border border-surface-cardBorder rounded-xl p-4">
          <div className="text-xs tracking-widest uppercase text-gray-500 mb-4">
            Topics ({coacheeTopics.length}) — Queue for Approval
          </div>
          {coacheeTopics.map((t) => (
            <div
              key={t.topic}
              className="flex items-center gap-3 p-3 bg-black rounded-lg mb-2"
            >
              <div className="flex-1">
                {t.date && (
                  <div className="text-xs text-gray-500 mb-1">{formatDateShort(t.date)}</div>
                )}
                <div className="text-sm font-semibold text-gray-300">{t.topic}</div>
              </div>
              {queued[t.topic] ? (
                <span className="bg-green-900/20 text-green-500 rounded-full px-2 py-1 text-xs">
                  ✓ Queued
                </span>
              ) : (
                <button
                  onClick={() => handleQueueNudge(t.topic)}
                  disabled={queueing === t.topic}
                  className="bg-primary text-primary-dark rounded-lg py-2 px-3 text-xs font-medium"
                >
                  {queueing === t.topic ? '...' : 'Queue'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="p-4">
      <div className="text-2xl font-display text-primary-light mb-4">Coachees</div>
      {coachees.map((c) => {
        const total = topics.filter((t) => t.coacheeName === c.coacheeName).length;
        const se = localSchedule.find((s) => s.coacheeName === c.coacheeName);

        return (
          <div
            key={c.coacheeName}
            onClick={() => {
              setSelected(c.coacheeName);
              setView('detail');
            }}
            className="bg-surface-card border border-surface-cardBorder rounded-xl p-4 mb-3 cursor-pointer flex items-center justify-between"
          >
            <div>
              <div className="font-semibold text-primary-light text-sm">{c.coacheeName}</div>
              <div className="text-xs text-gray-500 mt-1">{c.program} · {total} topics</div>
              {se && (
                <div className="mt-2 flex gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    se.active ? 'bg-green-900/20 text-green-500' : 'bg-surface-card text-gray-500'
                  }`}>
                    {se.active ? '● Active' : '○ Paused'}
                  </span>
                  <span className="bg-surface-card text-gray-500 rounded-full px-2 py-0.5 text-xs">
                    {se.channel === 'Email' ? '✉' : '💬'} {se.channel}
                  </span>
                </div>
              )}
            </div>
            <span className="text-gray-600 text-xl">›</span>
          </div>
        );
      })}
    </div>
  );
}

