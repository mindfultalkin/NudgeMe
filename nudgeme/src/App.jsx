import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './hooks/useIsMobile';
import { parseExcelFile } from './services/excelParser';
import { fetchQueue, fetchHistory, fetchSchedule } from './services/api';
import { DESKTOP_TABS } from './utils/constants';

// Desktop Components
import DesktopUpload from './components/desktop/DesktopUpload';
import OverviewTab from './components/desktop/OverviewTab';
import ApprovalsTab from './components/desktop/ApprovalsTab';
import CoacheesTab from './components/desktop/CoacheesTab';
import HistoryTab from './components/desktop/HistoryTab';
import NudgeDashboardTab from './components/desktop/NudgeDashboardTab';

// Mobile Components
import MobileUpload from './components/mobile/MobileUpload';
import MobileApp from './components/mobile/MobileApp';

export default function App() {
  const isMobile = useIsMobile();
  const [coachees, setCoachees] = useState(null);
  const [topics, setTopics] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [schedule, setSchedule] = useState([]);

  // API fetch functions
  const fetchQueueData = useCallback(async () => {
    try {
      const data = await fetchQueue();
      setQueue(data);
    } catch (e) {
      console.error('Error fetching queue:', e);
    }
  }, []);

  const fetchHistoryData = useCallback(async () => {
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (e) {
      console.error('Error fetching history:', e);
    }
  }, []);

  const fetchScheduleData = useCallback(async () => {
    try {
      const data = await fetchSchedule();
      setSchedule(data);
    } catch (e) {
      console.error('Error fetching schedule:', e);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (coachees) {
      fetchQueueData();
      fetchHistoryData();
      fetchScheduleData();
    }
  }, [coachees, fetchQueueData, fetchHistoryData, fetchScheduleData]);

  // Polling for queue updates
  useEffect(() => {
    if (!coachees) return;
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, [coachees, fetchQueueData]);

  // File upload handler
  const handleUpload = async (file) => {
    setUploadError('');
    try {
      const { coachees: c, topics: t } = await parseExcelFile(file);
      setCoachees(c);
      setTopics(t);
      setFileName(file.name);
    } catch (err) {
      setUploadError(err.message);
    }
  };

  // Reset handler
  const handleReset = () => {
    setCoachees(null);
    setTopics(null);
    setFileName('');
    setQueue([]);
    setHistory([]);
  };

  // Loading state - show upload screen
  if (!coachees || !topics) {
    return isMobile 
      ? <MobileUpload onUpload={handleUpload} error={uploadError} />
      : <DesktopUpload onUpload={handleUpload} error={uploadError} />;
  }

  // Mobile app
  if (isMobile) {
    return (
      <MobileApp
        coachees={coachees}
        topics={topics}
        queue={queue}
        history={history}
        schedule={schedule}
        fileName={fileName}
        onReset={handleReset}
        fetchQueue={fetchQueueData}
        fetchHistory={fetchHistoryData}
        onScheduleUpdate={setSchedule}
      />
    );
  }

  // Desktop app
  const pendingCount = queue.filter((q) => q.status === 'pending').length;
  const tabs = DESKTOP_TABS.map(tab => {
    if (tab.id === 'approvals' && pendingCount > 0) {
      return { ...tab, label: `Approvals (${pendingCount})` };
    }
    return tab;
  });

  return (
    <div className="font-serif min-h-screen bg-surface-light text-primary-dark">
      {/* Header */}
      <div className="bg-primary-dark text-primary-light px-10 py-7 border-b-4 border-primary">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          {/* Logo & Title */}
          <div>
            <div className="text-xs tracking-widest uppercase text-primary mb-1">AI Coaching Agent</div>
            <h1 className="m-0 text-3xl font-normal tracking-tighter leading-none">NudgeMe</h1>
            <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
              <span className="text-success">●</span> {fileName}
              <button 
                onClick={handleReset}
                className="bg-transparent border border-gray-600 text-gray-500 px-2 py-0.5 text-xs tracking-widest uppercase rounded-sm cursor-pointer font-serif"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-12 text-center">
            {[
              { label: 'Coachees', val: coachees.length },
              { label: 'Topics', val: topics.length },
              { label: 'Sent', val: history.length },
              { label: 'Pending', val: pendingCount, alert: pendingCount > 0 },
            ].map((stat) => (
              <div key={stat.label}>
                <div 
                  className="text-2xl font-bold" 
                  style={{ color: stat.alert ? '#e05a2b' : '#c9a84c', lineHeight: 1 }}
                >
                  {stat.val}
                </div>
                <div className="text-xs uppercase tracking-widest text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'approvals') fetchQueueData();
                if (tab.id === 'history') fetchHistoryData();
              }}
              className={`px-5 py-2 text-sm uppercase tracking-widest cursor-pointer rounded-t-sm font-serif transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-dark border border-b-0 border-primary'
                  : 'bg-transparent text-gray-500 border border-b-0 border-transparent hover:text-gray-300'
              }`}
              style={{
                background: activeTab === tab.id ? '#c9a84c' : 'transparent',
                color: activeTab === tab.id ? '#1a1a18' : '#aaa',
                borderColor: activeTab === tab.id ? '#c9a84c' : '#333',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 max-w-6xl mx-auto">
        {activeTab === 'overview' && (
          <OverviewTab coachees={coachees} topics={topics} history={history} queue={queue} />
        )}
        {activeTab === 'nudges' && (
          <NudgeDashboardTab coachees={coachees} topics={topics} />
        )}
        {activeTab === 'approvals' && (
          <ApprovalsTab 
            queue={queue} 
            onRefresh={() => { fetchQueueData(); fetchHistoryData(); }} 
          />
        )}
        {activeTab === 'coachees' && (
          <CoacheesTab 
            coachees={coachees} 
            topics={topics} 
            schedule={schedule} 
            onScheduleUpdate={setSchedule} 
          />
        )}
        {activeTab === 'history' && (
          <HistoryTab history={history} coachees={coachees} />
        )}
      </div>
    </div>
  );
}

