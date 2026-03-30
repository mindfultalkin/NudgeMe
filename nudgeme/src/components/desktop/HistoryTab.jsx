import { useState } from 'react';
import { formatDate } from '../../utils/helpers';

export default function HistoryTab({ history, coachees }) {
  const [filter, setFilter] = useState('ALL');
  const names = ['ALL', ...Array.from(new Set(coachees.map(c => c.coacheeName)))];
  const filtered = filter === 'ALL' ? history : history.filter(h => h.coacheeName === filter);

  // Group by date
  const grouped = {};
  filtered.forEach(h => {
    const d = h.sentAt ? new Date(h.sentAt).toDateString() : 'Unknown Date';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(h);
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <section className="mb-12">
        <h1 className="font-serif text-5xl text-on-surface mb-4 leading-tight">
          Your impact, <br/><span className="text-primary italic">documented.</span>
        </h1>
        <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Review the trajectory of growth across your coaching cohort. Every nudge is a step toward mastery.
        </p>
      </section>

      {/* Filter bar */}
      <div className="sticky top-16 z-30 py-4 mb-8 bg-surface/90 backdrop-blur-md">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {names.map(name => {
            const count = name === 'ALL' ? history.length : history.filter(h => h.coacheeName === name).length;
            return (
              <button key={name} onClick={() => setFilter(name)}
                className={`px-5 py-2 rounded-full text-sm flex items-center gap-2 whitespace-nowrap transition-colors font-medium ${
                  filter === name
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}>
                {name}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter===name ? 'bg-white/20' : 'bg-outline-variant/30'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* History feed */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-outline-variant text-2xl">auto_stories</span>
          </div>
          <p className="font-serif italic text-on-surface-variant">No nudges sent yet.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <h3 className="font-serif text-2xl text-on-surface mb-6 flex items-center gap-4">
                {date}
                <span className="h-px flex-1 bg-outline-variant/20" />
              </h3>
              <div className="space-y-5">
                {entries.map((h, i) => {
                  const colors = ['border-primary', 'border-tertiary', 'border-slate-300'];
                  const color = colors[i % colors.length];
                  return (
                    <div key={i} className={`group bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row gap-8 hover:shadow-2xl hover:shadow-primary/5 transition-all border-l-4 ${color}`}>
                      <div className="flex-shrink-0 w-44">
                        <div className="mb-4">
                          <p className="font-bold text-sm text-on-surface">{h.coacheeName}</p>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider">
                          {h.topic?.substring(0,25)}{h.topic?.length > 25 ? '...' : ''}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                            Delivered
                          </div>
                        </div>
                        <blockquote className={`text-on-surface-variant italic border-l-2 pl-6 py-2 mb-4 leading-relaxed border-${color.replace('border-','')}`}>
                          "{h.nudge}"
                        </blockquote>
                        <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {h.sentAt ? new Date(h.sentAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">chat_bubble</span>
                            {h.topic}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 text-center pb-12">
        <div className="inline-flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-outline-variant text-lg">auto_stories</span>
          </div>
          <p className="font-serif italic text-on-surface-variant text-sm">
            {filtered.length} nudge{filtered.length !== 1 ? 's' : ''} in this view.
          </p>
        </div>
      </div>
    </div>
  );
}