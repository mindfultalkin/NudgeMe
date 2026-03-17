import { useState, useEffect, useCallback } from 'react';
import MobOverview from './MobOverview';
import MobNudges from './MobNudges';
import MobApprovals from './MobApprovals';
import MobCoachees from './MobCoachees';
import MobHistory from './MobHistory';
import { MOBILE_NAV_ITEMS } from '../../utils/constants';

export default function MobileApp({ 
  coachees, 
  topics, 
  queue, 
  history, 
  schedule, 
  fileName, 
  onReset, 
  fetchQueue, 
  fetchHistory, 
  onScheduleUpdate 
}) {
  const [tab, setTab] = useState('home');
  const pending = queue.filter((q) => q.status === 'pending').length;

  // Update nav items with pending count
  const navItems = MOBILE_NAV_ITEMS.map(item => {
    if (item.id === 'approvals') {
      return { ...item, label: pending > 0 ? `OK(${pending})` : 'OK' };
    }
    return item;
  });

  return (
    <div className="min-h-screen bg-surface-dark text-primary-light font-sans pb-[72px]">
      {/* Header */}
      <div className="bg-surface-dark px-4 py-3 border-b border-surface-cardBorder sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs tracking-widest uppercase text-primary">NudgeMe · AI Coaching Agent</div>
            <div className="font-display text-lg text-primary-light leading-tight">{fileName}</div>
          </div>
          <div className="flex items-center gap-2">
            {pending > 0 && (
              <span className="bg-warning text-white rounded-full w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold">
                {pending}
              </span>
            )}
            <button 
              onClick={onReset}
              className="bg-surface-card border border-surface-cardBorder text-gray-500 rounded-lg px-2 py-1 text-xs cursor-pointer font-sans"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'home' && (
        <MobOverview 
          coachees={coachees} 
          topics={topics} 
          history={history} 
          queue={queue} 
          onTabChange={setTab} 
        />
      )}
      {tab === 'nudges' && (
        <MobNudges coachees={coachees} topics={topics} />
      )}
      {tab === 'approvals' && (
        <MobApprovals 
          queue={queue} 
          onRefresh={() => { fetchQueue(); fetchHistory(); }} 
        />
      )}
      {tab === 'coachees' && (
        <MobCoachees 
          coachees={coachees} 
          topics={topics} 
          schedule={schedule} 
          onScheduleUpdate={onScheduleUpdate} 
        />
      )}
      {tab === 'history' && (
        <MobHistory history={history} coachees={coachees} />
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-dark border-t border-surface-cardBorder flex z-50 pb-safe">
        {navItems.map((n) => (
          <button
            key={n.id}
            onClick={() => {
              setTab(n.id);
              if (n.id === 'approvals') fetchQueue();
              if (n.id === 'history') fetchHistory();
            }}
            className={`flex-1 bg-none border-none py-3 flex flex-col items-center gap-0.5 cursor-pointer font-sans ${
              tab === n.id ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <span className="text-lg">{n.icon}</span>
            <span className="text-[10px] tracking-wider">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

