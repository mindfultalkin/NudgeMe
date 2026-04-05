import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from './hooks/useIsMobile';
import { parseExcelFile } from './services/excelParser';
import { parseGoogleSheet } from './services/sheetsParser';
import { fetchQueue, fetchHistory, fetchSchedule } from './services/api';

import DesktopUpload from './components/desktop/DesktopUpload';
import OverviewTab from './components/desktop/OverviewTab';
import ApprovalsTab from './components/desktop/ApprovalsTab';
import CoacheesTab from './components/desktop/CoacheesTab';
import HistoryTab from './components/desktop/HistoryTab';
import NudgeDashboardTab from './components/desktop/NudgeDashboardTab';
import GuardrailsTab from './components/desktop/GuardrailsTab';
import MobileUpload from './components/mobile/MobileUpload';
import MobileApp from './components/mobile/MobileApp';

const NAV = [
  { id: 'overview',    label: 'Overview',        icon: 'dashboard' },
  { id: 'nudges',      label: 'Nudge Dashboard',  icon: 'bolt' },
  { id: 'approvals',   label: 'Approvals',        icon: 'fact_check' },
  { id: 'coachees',    label: 'Coachees',         icon: 'group' },
  { id: 'history',     label: 'History',          icon: 'history' },
  { id: 'guardrails',  label: 'Guardrails',       icon: 'gavel' },
];

const SHEET_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function App() {
  const isMobile = useIsMobile();
  const [coachees, setCoachees]       = useState(null);
  const [topics, setTopics]           = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [fileName, setFileName]       = useState('');
  const [activeTab, setActiveTab]     = useState('overview');
  const [queue, setQueue]             = useState([]);
  const [history, setHistory]         = useState([]);
  const [schedule, setSchedule]       = useState([]);
  const [sheetUrl, setSheetUrl]       = useState('');
  const [lastSync, setLastSync]       = useState(null);
  const [syncing, setSyncing]         = useState(false);
  const sheetUrlRef = useRef('');

  const fetchQueueData    = useCallback(async () => { try { const d = await fetchQueue();    setQueue(d);    } catch(e){} }, []);
  const fetchHistoryData  = useCallback(async () => { try { const d = await fetchHistory();  setHistory(d);  } catch(e){} }, []);
  const fetchScheduleData = useCallback(async () => { try { const d = await fetchSchedule(); setSchedule(d); } catch(e){} }, []);

  useEffect(() => {
    if (coachees) { fetchQueueData(); fetchHistoryData(); fetchScheduleData(); }
  }, [coachees]);

  useEffect(() => {
    if (!coachees) return;
    const t = setInterval(fetchQueueData, 120000);
    return () => clearInterval(t);
  }, [coachees]);

  // ── Auto-refresh Google Sheet every 5 minutes ──
  useEffect(() => {
    if (!sheetUrlRef.current) return;
    const interval = setInterval(async () => {
      if (!sheetUrlRef.current) return;
      setSyncing(true);
      try {
        const data = await parseGoogleSheet(sheetUrlRef.current);
        setCoachees(data.coachees);
        setTopics(data.topics);
        setLastSync(new Date());
      } catch(e) { console.error('Sheet sync failed:', e.message); }
      setSyncing(false);
    }, SHEET_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [sheetUrl]);

  // ── Excel upload handler ──
  const handleUpload = async (file) => {
    setUploadError('');
    try {
      const { coachees: c, topics: t } = await parseExcelFile(file);
      setCoachees(c); setTopics(t); setFileName(file.name);
      setSheetUrl(''); sheetUrlRef.current = '';
    } catch(err) { setUploadError(err.message); }
  };

  // ── Google Sheets load handler ──
  const handleSheetsLoad = (data, url) => {
    setCoachees(data.coachees);
    setTopics(data.topics);
    setFileName(`Google Sheet (${data.coachees.length} coachees)`);
    setSheetUrl(url);
    sheetUrlRef.current = url;
    setLastSync(new Date());
  };

  // ── Manual sync ──
  const handleManualSync = async () => {
    if (!sheetUrlRef.current) return;
    setSyncing(true);
    try {
      const data = await parseGoogleSheet(sheetUrlRef.current);
      setCoachees(data.coachees);
      setTopics(data.topics);
      setLastSync(new Date());
    } catch(e) { alert('Sync failed: ' + e.message); }
    setSyncing(false);
  };

  const handleReset = () => {
    setCoachees(null); setTopics(null); setFileName('');
    setQueue([]); setHistory([]); setSheetUrl('');
    sheetUrlRef.current = '';
  };

  // ── Show upload screen ──
  if (!coachees || !topics) {
    return isMobile
      ? <MobileUpload onUpload={handleUpload} error={uploadError} />
      : <DesktopUpload onUpload={handleUpload} onSheetsLoad={handleSheetsLoad} error={uploadError} />;
  }

  // ── Mobile ──
  if (isMobile) {
    return <MobileApp coachees={coachees} topics={topics} queue={queue} history={history}
      schedule={schedule} fileName={fileName} onReset={handleReset}
      fetchQueue={fetchQueueData} fetchHistory={fetchHistoryData} onScheduleUpdate={setSchedule} />;
  }

  const pendingCount = queue.filter(q => q.status === 'pending').length;

  return (
    <div className="flex min-h-screen bg-surface text-on-surface font-body">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-50 flex flex-col py-8 px-4 z-40">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-serif italic text-primary">NudgeMe</h1>
          <p className="text-[10px] uppercase tracking-widest text-outline mt-1">AI Coaching Agent</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map(item => {
            const isActive = activeTab === item.id;
            const badge = item.id === 'approvals' && pendingCount > 0 ? pendingCount : null;
            return (
              <button key={item.id} onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'approvals') fetchQueueData();
                if (item.id === 'history') fetchHistoryData();
              }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive ? 'text-primary font-bold bg-white shadow-sm' : 'text-slate-500 hover:text-primary hover:translate-x-1'
                }`}>
                <span className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {badge && <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-outline-variant/20 px-2 space-y-3">
          {/* Sync status */}
          {sheetUrl && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${syncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-[10px] text-outline">
                  {syncing ? 'Syncing...' : lastSync ? `Synced ${lastSync.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}` : 'Google Sheet'}
                </span>
              </div>
              <button onClick={handleManualSync} disabled={syncing}
                className="flex items-center gap-1 text-[10px] text-primary hover:underline disabled:opacity-50">
                <span className="material-symbols-outlined text-[12px]">sync</span>
                Sync now
              </button>
            </div>
          )}
          {!sheetUrl && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-[10px] text-outline truncate">{fileName}</span>
            </div>
          )}
          <button onClick={handleReset}
            className="text-xs text-outline hover:text-primary transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
            Change Source
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-outline">Dashboard</span>
            <span className="material-symbols-outlined text-sm text-outline-variant">chevron_right</span>
            <span className="text-primary font-semibold border-b-2 border-primary pb-0.5">
              {NAV.find(n => n.id === activeTab)?.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-outline">
            <span>{coachees.length} coachees</span>
            <span className="text-outline-variant">·</span>
            <span>{topics.length} topics</span>
            <span className="text-outline-variant">·</span>
            <span className="text-green-600 font-semibold">{history.length} sent</span>
            {pendingCount > 0 && <>
              <span className="text-outline-variant">·</span>
              <span className="text-error font-semibold">{pendingCount} pending</span>
            </>}
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'overview'   && <OverviewTab coachees={coachees} topics={topics} history={history} queue={queue} />}
          {activeTab === 'nudges'     && <NudgeDashboardTab coachees={coachees} topics={topics} />}
          {activeTab === 'approvals'  && <ApprovalsTab queue={queue} onRefresh={() => { fetchQueueData(); fetchHistoryData(); }} />}
          {activeTab === 'coachees'   && <CoacheesTab coachees={coachees} topics={topics} schedule={schedule} onScheduleUpdate={setSchedule} />}
          {activeTab === 'history'    && <HistoryTab history={history} coachees={coachees} />}
          {activeTab === 'guardrails' && <GuardrailsTab topics={[...new Set(topics.map(t => t.topic))]} />}
        </div>
      </main>
    </div>
  );
}