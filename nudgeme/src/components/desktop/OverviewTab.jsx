import { formatDateShort } from '../../utils/helpers';

export default function OverviewTab({ coachees, topics, history, queue }) {
  const pending = queue.filter(q => q.status === 'pending').length;
  const topicCoverage = topics.length > 0
    ? Math.round((new Set(history.map(h => h.topic)).size / topics.length) * 100) : 0;

  const stats = [
    { label: 'Coachees', val: coachees.length, icon: 'group', accent: 'bg-primary-fixed text-primary', badge: null },
    { label: 'Active Topics', val: topics.length, icon: 'psychology', accent: 'bg-tertiary-fixed text-tertiary', badge: null },
    { label: 'Nudges Sent', val: history.length, icon: 'send', accent: 'bg-blue-50 text-blue-600', badge: '+active' },
    { label: 'Pending Review', val: pending, icon: 'fact_check', accent: 'bg-on-primary text-on-primary', dark: true, badge: pending > 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero */}
      <header className="mb-12">
        <h2 className="font-serif text-4xl md:text-5xl italic text-on-surface mb-2 tracking-tight">
          Welcome back, Coach
        </h2>
        <p className="text-lg text-on-surface-variant max-w-2xl opacity-80">
          {history.length > 0
            ? `${history.length} nudges delivered across ${coachees.length} coachees. Keep the momentum going.`
            : `You have ${coachees.length} coachees and ${topics.length} topics loaded. Start generating nudges.`}
        </p>
      </header>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {/* Coachees */}
        <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between hover:bg-surface-container transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-primary p-3 bg-primary-fixed rounded-full">group</span>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant uppercase tracking-widest mb-1">Coachees</p>
            <h3 className="font-serif text-4xl font-bold">{coachees.length}</h3>
          </div>
        </div>

        {/* Topics */}
        <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between border-b-4 border-tertiary-container/50">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-tertiary p-3 bg-tertiary-fixed rounded-full">psychology</span>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant uppercase tracking-widest mb-1">Active Topics</p>
            <h3 className="font-serif text-4xl font-bold">{topics.length}</h3>
          </div>
        </div>

        {/* Sent */}
        <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between hover:bg-surface-container transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-blue-600 p-3 bg-blue-50 rounded-full">send</span>
            <div className="flex items-center gap-1 text-green-600">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="text-xs font-bold">{topicCoverage}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant uppercase tracking-widest mb-1">Nudges Sent</p>
            <h3 className="font-serif text-4xl font-bold">{history.length}</h3>
          </div>
        </div>

        {/* Pending */}
        <div className={`p-8 rounded-xl flex flex-col justify-between shadow-xl ${
          pending > 0 ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <span className={`material-symbols-outlined p-3 rounded-full ${pending > 0 ? 'bg-white/20' : 'bg-surface-container text-on-surface-variant'}`}>fact_check</span>
          </div>
          <div>
            <p className={`text-sm uppercase tracking-widest mb-1 ${pending > 0 ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>Pending Review</p>
            <h3 className="font-serif text-4xl font-bold">{pending}</h3>
            {pending > 0 && (
              <button className="mt-4 text-xs font-bold bg-white text-primary px-3 py-2 rounded-lg flex items-center gap-2">
                Review Now <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h4 className="font-serif text-2xl text-on-surface">Coachee Progress</h4>
              <p className="text-sm text-on-surface-variant">Topic coverage across your cohort.</p>
            </div>
          </div>
          <div className="space-y-4">
            {coachees.map(c => {
              const sent  = history.filter(h => h.coacheeName === c.coacheeName).length;
              const total = topics.filter(t => t.coacheeName === c.coacheeName).length;
              const pct   = total > 0 ? Math.round((sent / total) * 100) : 0;
              return (
                <div key={c.coacheeName} className="bg-surface-container-lowest p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-bold text-on-surface">{c.coacheeName}</p>
                      <p className="text-xs text-on-surface-variant">{c.program}</p>
                    </div>
                    <span className="text-sm font-bold text-tertiary">{pct}%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-gradient-to-r from-tertiary to-tertiary-container h-2 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="text-xs text-on-surface-variant">{sent}/{total} topics nudged</span>
                    <span className="text-outline-variant">·</span>
                    <span className="text-xs text-on-surface-variant">{c.email}</span>
                  </div>
                </div>
              );
            })}
            {coachees.length === 0 && (
              <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-on-surface-variant italic">
                No coachees loaded yet.
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-surface-container-low rounded-2xl p-8 h-fit">
          <h4 className="font-serif text-xl text-on-surface mb-8">Recent Activity</h4>
          <div className="space-y-6 relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-outline-variant/30 z-0" />
            {history.length === 0 && (
              <p className="text-sm text-on-surface-variant italic pl-10">No nudges sent yet.</p>
            )}
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="relative z-10 flex gap-4">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center border-2 border-surface-container-low flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px] text-green-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Nudge Sent</p>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    "{h.nudge?.substring(0, 60)}..." → {h.coacheeName}
                  </p>
                  <span className="text-[10px] text-on-surface-variant opacity-60 uppercase font-bold mt-1 block">
                    {h.topic} · {formatDateShort(h.sentAt)}
                  </span>
                </div>
              </div>
            ))}
            {queue.filter(q => q.status === 'pending').slice(0, 2).map((q, i) => (
              <div key={`q${i}`} className="relative z-10 flex gap-4">
                <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center border-2 border-surface-container-low flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Awaiting Approval</p>
                  <p className="text-xs text-on-surface-variant mt-1">"{q.nudge?.substring(0,50)}..." → {q.coacheeName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}