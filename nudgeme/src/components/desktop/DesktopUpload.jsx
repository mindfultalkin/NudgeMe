import { useState, useCallback } from 'react';
import { parseGoogleSheet } from '../../services/sheetsParser';
import { parseExcelFile } from '../../services/excelParser';

export default function DesktopUpload({ onUpload, onSheetsLoad, error }) {
  const [dragging, setDragging]   = useState(false);
  const [sheetUrl, setSheetUrl]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [sheetError, setSheetErr] = useState('');
  const [tab, setTab]             = useState('sheets'); // 'sheets' | 'excel'

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/)) { alert('Please upload an Excel file (.xlsx or .xls)'); return; }
    onUpload(file);
  }, [onUpload]);

  const handleSheetConnect = async () => {
    if (!sheetUrl.trim()) { setSheetErr('Please paste a Google Sheets URL.'); return; }
    setLoading(true); setSheetErr('');
    try {
      const data = await parseGoogleSheet(sheetUrl.trim());
      onSheetsLoad(data, sheetUrl.trim());
    } catch(e) {
      setSheetErr(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body flex flex-col">
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-full bg-gradient-to-l from-primary-fixed/20 to-transparent pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-1/2 h-1/2 bg-gradient-to-tr from-tertiary-fixed/10 to-transparent pointer-events-none blur-3xl" />

      {/* Nav */}
      <nav className="h-20 flex items-center justify-between px-12">
        <h1 className="text-2xl font-serif italic font-bold text-on-surface">NudgeMe</h1>
        <p className="text-xs text-outline uppercase tracking-widest">AI Coaching Agent · Mindfultalk</p>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-6 pb-20">
        {/* Header */}
        <header className="text-center max-w-2xl mb-12">
          <h1 className="font-serif text-5xl md:text-6xl text-on-surface font-bold leading-tight mb-4">
            The informed path to<br/>
            <span className="text-primary italic">mentorship.</span>
          </h1>
          <p className="font-serif text-xl text-on-surface-variant italic font-light">
            One line. One practice. One step forward.
          </p>
        </header>

        <div className="w-full max-w-4xl">
          {/* Tab toggle */}
          <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl mb-6 w-fit mx-auto">
            <button onClick={() => setTab('sheets')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                tab === 'sheets' ? 'bg-white shadow-sm text-primary' : 'text-outline hover:text-on-surface'
              }`}>
              <span className="material-symbols-outlined text-sm align-middle mr-1">link</span>
              Google Sheets
            </button>
            <button onClick={() => setTab('excel')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                tab === 'excel' ? 'bg-white shadow-sm text-primary' : 'text-outline hover:text-on-surface'
              }`}>
              <span className="material-symbols-outlined text-sm align-middle mr-1">upload_file</span>
              Excel Upload
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* Left — main input */}
            <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-8 flex flex-col justify-center"
              style={{ boxShadow: '0 32px 64px -12px rgba(25,28,29,0.06)' }}>

              {tab === 'sheets' ? (
                /* ── Google Sheets tab ── */
                <div className="space-y-6">
                  <div>
                    <p className="font-serif text-2xl font-semibold text-on-surface mb-2">Connect Google Sheet</p>
                    <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                      Paste your Google Sheets URL below. The sheet must be set to
                      <strong> "Anyone with link can view"</strong>. NudgeMe auto-syncs when you switch back to this tab.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={e => { setSheetUrl(e.target.value); setSheetErr(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleSheetConnect()}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                    {sheetError && (
                      <div className="bg-error-container text-on-error-container rounded-xl p-3 text-sm flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">warning</span>
                        {sheetError}
                      </div>
                    )}
                    <button onClick={handleSheetConnect} disabled={loading || !sheetUrl.trim()}
                      className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                      {loading ? (
                        <><span className="material-symbols-outlined animate-spin text-sm">refresh</span> Connecting...</>
                      ) : (
                        <><span className="material-symbols-outlined text-sm">link</span> Connect & Load Data</>
                      )}
                    </button>
                  </div>

                  <div className="border-t border-outline-variant/20 pt-4">
                    <p className="text-xs text-outline font-bold uppercase tracking-widest mb-3">How to share your sheet</p>
                    <div className="space-y-2 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span> Open your Google Sheet → click Share</div>
                      <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span> Change access to "Anyone with the link"</div>
                      <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span> Copy the link and paste it above</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Excel tab ── */
                <div>
                  <p className="font-serif text-2xl font-semibold text-on-surface mb-2">Upload Excel File</p>
                  <p className="text-sm text-on-surface-variant mb-6">Upload a .xlsx file with Coachee Details and Topics Covered sheets.</p>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                    onClick={() => document.getElementById('upload-input').click()}
                    className={`w-full h-64 rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
                      dragging ? 'bg-primary-fixed/30 border-2 border-primary border-solid' : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                    style={{ backgroundImage: dragging ? 'none' : "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='%23727785' stroke-width='2' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
                  >
                    <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
                    <div className="text-center">
                      <p className="font-semibold text-on-surface">{dragging ? 'Drop it!' : 'Drop Excel file here'}</p>
                      <p className="text-sm text-on-surface-variant mt-1">or click to browse · .xlsx only</p>
                    </div>
                    <input id="upload-input" type="file" accept=".xlsx,.xls" className="hidden"
                      onChange={e => handleFile(e.target.files[0])} />
                  </div>
                  {error && (
                    <div className="mt-4 bg-error-container text-on-error-container rounded-xl p-3 text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">warning</span>{error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right cards */}
            <div className="md:col-span-4 flex flex-col gap-5">
              <div className="bg-tertiary-fixed/20 rounded-xl p-6 flex-grow flex flex-col justify-between relative overflow-hidden">
                <div>
                  <span className="inline-block bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4">Auto-sync</span>
                  <h3 className="font-serif text-xl text-on-surface font-bold leading-snug">Data updates automatically from your sheet.</h3>
                  <p className="text-sm text-on-surface-variant mt-2">No re-uploads needed. Edit the sheet — NudgeMe picks it up.</p>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-20 transform rotate-12">
                  <span className="material-symbols-outlined text-8xl text-tertiary">sync</span>
                </div>
              </div>
              <div className="bg-surface-container-low rounded-xl p-5 border-l-4 border-primary">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Required Sheets</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Sheet 1: <strong>Coachee Details</strong><br/>
                  Coach · Coachee Name · Program · Coachee Phone No. · Coachee Email<br/><br/>
                  Sheet 2: <strong>Topics Covered</strong><br/>
                  Date · Topic · Coach · Coachee Name
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}