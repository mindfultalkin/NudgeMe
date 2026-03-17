import { formatDateShort } from '../../utils/helpers';

export default function MobOverview({ coachees, topics, history, queue, onTabChange }) {
  const pending = queue.filter((q) => q.status === 'pending').length;

  const stats = [
    { label: 'Coachees', val: coachees.length, icon: '👤' },
    { label: 'Topics', val: topics.length, icon: '📌' },
    { label: 'Sent', val: history.length, icon: '✅' },
    { label: 'Pending', val: pending, icon: '⏳', alert: pending > 0 },
  ];

  const today = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-5">
        <div className="text-xs tracking-widest uppercase text-primary mb-1">Coach Dashboard</div>
        <h2 className="m-0 text-2xl font-normal font-display text-primary-light">Overview</h2>
        <p className="m-0 mt-1 text-sm text-gray-500">{today}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {stats.map((s) => (
          <div 
            key={s.label}
            className="bg-surface-card border border-surface-cardBorder rounded-xl p-4 flex items-center gap-3"
          >
            <span className="text-2xl">{s.icon}</span>
            <div>
              <div className="text-xl font-bold" style={{ color: s.alert ? '#e05a2b' : '#c9a84c', lineHeight: 1 }}>
                {s.val}
              </div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Alert */}
      {pending > 0 && (
        <div 
          onClick={() => onTabChange('approvals')}
          className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4 mb-4 cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-primary font-semibold text-sm">
              {pending} nudge{pending > 1 ? 's' : ''} awaiting approval
            </div>
            <div className="text-xs text-gray-500 mt-1">Tap to review & approve</div>
          </div>
          <span className="text-primary text-xl">›</span>
        </div>
      )}

      {/* Section: Coachees */}
      <div className="text-xs tracking-widest uppercase text-gray-500 mb-3">Coachees</div>
      {coachees.map((c) => {
        const sent = history.filter((h) => h.coacheeName === c.coacheeName).length;
        const total = topics.filter((t) => t.coacheeName === c.coacheeName).length;
        const pct = total > 0 ? Math.round((sent / total) * 100) : 0;

        return (
          <div key={c.coacheeName} className="bg-surface-card border border-surface-cardBorder rounded-xl p-4 mb-3">
            <div className="flex justify-between mb-3">
              <div>
                <div className="font-semibold text-primary-light text-sm">{c.coacheeName}</div>
                <div className="text-xs text-gray-500 mt-1">{c.program}</div>
              </div>
              <span className="bg-green-900/20 text-green-500 rounded-full px-3 py-1 text-xs">
                {sent}/{total}
              </span>
            </div>
            <div className="bg-surface-cardBorder rounded-sm h-1">
              <div 
                className="bg-primary h-1 rounded-sm transition-all duration-600" 
                style={{ width: `${pct}%` }} 
              />
            </div>
            <div className="text-xs text-gray-600 mt-2">{pct}% coverage</div>
          </div>
        );
      })}

      {/* Recent Activity */}
      {history.length > 0 && (
        <>
          <div className="text-xs tracking-widest uppercase text-gray-500 mt-5 mb-3">Recent Activity</div>
          {history.slice(0, 3).map((h, i) => (
            <div key={i} className="bg-surface-card border-l-2 border-success rounded-xl p-4 mb-2">
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-xs">{h.coacheeName}</span>
                <span className="text-xs text-gray-500">{formatDateShort(h.sentAt)}</span>
              </div>
              <div className="text-xs text-gray-500 mb-1">{h.topic}</div>
              <div className="italic text-xs text-gray-400">{h.nudge}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

