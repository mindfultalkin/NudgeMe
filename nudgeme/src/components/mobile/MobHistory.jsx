import { useState } from 'react';
import { formatDateShort } from '../../utils/helpers';

export default function MobHistory({ history, coachees }) {
  const [filter, setFilter] = useState('ALL');
  
  const names = ['ALL', ...Array.from(new Set(coachees.map((c) => c.coacheeName)))];
  const filtered = filter === 'ALL' ? history : history.filter((h) => h.coacheeName === filter);

  return (
    <div className="p-4">
      <div className="text-2xl font-display text-primary-light mb-4">History</div>

      {/* Filter Pills */}
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

      <div className="text-xs text-gray-600 mb-3">
        {filtered.length} nudge{filtered.length !== 1 ? 's' : ''} delivered
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-surface-card border border-surface-cardBorder rounded-xl p-8 text-center text-gray-500 italic text-sm">
          No nudges sent yet
        </div>
      ) : (
        filtered.map((h, i) => (
          <div 
            key={i} 
            className="bg-surface-card border border-surface-cardBorder rounded-xl p-4 mb-3 border-l-2 border-success"
          >
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-xs">{h.coacheeName}</span>
              <span className="text-xs text-gray-500">{formatDateShort(h.sentAt)}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">{h.topic}</div>
            <div className="italic text-sm text-gray-400 border-l-2 border-surface-cardBorder pl-2 leading-relaxed">
              {h.nudge}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

