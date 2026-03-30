import { useState, useCallback } from 'react';

export default function DesktopUpload({ onUpload, error }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/)) { alert('Please upload an Excel file (.xlsx or .xls)'); return; }
    onUpload(file);
  }, [onUpload]);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body flex flex-col">
      {/* Fixed gradient backgrounds */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-full bg-gradient-to-l from-primary-fixed/20 to-transparent pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-1/2 h-1/2 bg-gradient-to-tr from-tertiary-fixed/10 to-transparent pointer-events-none blur-3xl" />

      {/* Nav */}
      <nav className="h-20 flex items-center justify-between px-12">
        <h1 className="text-2xl font-serif italic font-bold text-on-surface">NudgeMe</h1>
        <div className="flex items-center gap-6 text-sm text-outline">
          <a href="#" className="hover:text-primary transition-colors">Documentation</a>
          <a href="#" className="hover:text-primary transition-colors">Support</a>
        </div>
      </nav>

      {/* Main */}
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

        {/* Upload bento */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Upload zone */}
          <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-8 flex flex-col items-center justify-center"
            style={{ boxShadow: '0 32px 64px -12px rgba(25,28,29,0.06)' }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('upload-input').click()}
              className={`w-full h-80 rounded-xl flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 ${
                dragging ? 'bg-primary-fixed/30 border-2 border-primary border-solid' : 'bg-surface-container-low hover:bg-surface-container'
              }`}
              style={{ backgroundImage: dragging ? 'none' : "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='%23727785' stroke-width='2' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
            >
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-4xl">upload_file</span>
              </div>
              <div className="text-center">
                <p className="font-serif text-lg font-semibold text-on-surface mb-1">
                  {dragging ? 'Drop it here!' : 'Drop your Excel file here'}
                </p>
                <p className="text-sm text-on-surface-variant">or browse your local directory</p>
              </div>
              <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2">
                <span>Choose File</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <input id="upload-input" type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => handleFile(e.target.files[0])} />
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-outline">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span>Your data is processed locally for privacy.</span>
            </div>
            {error && (
              <div className="mt-4 w-full bg-error-container text-on-error-container rounded-xl p-4 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                {error}
              </div>
            )}
          </div>

          {/* Right cards */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="bg-tertiary-fixed/20 rounded-xl p-6 flex-grow flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <span className="inline-block bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4">Preparation</span>
                <h3 className="font-serif text-2xl text-on-surface font-bold leading-snug">Getting your data ready for AI.</h3>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-20 transform rotate-12">
                <span className="material-symbols-outlined text-9xl text-tertiary">auto_awesome_motion</span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-6 border-l-4 border-primary">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Required Schema</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">Two sheets: <strong>Coachee Details</strong> and <strong>Topics Covered</strong> with exact column names.</p>
            </div>
          </div>
        </div>

        {/* Schema guide */}
        <div className="w-full max-w-4xl mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-outline-variant/20 pt-12">
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person_search</span>
            </div>
            <div>
              <h4 className="font-serif text-xl font-semibold mb-2">Sheet 1: Coachee Details</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Coach · Coachee Name · Program · Coachee Phone No. · Coachee Email</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">menu_book</span>
            </div>
            <div>
              <h4 className="font-serif text-xl font-semibold mb-2">Sheet 2: Topics Covered</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Date · Topic · Coach · Coachee Name</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 px-12 border-t border-outline-variant/10 flex justify-between items-center text-sm text-outline">
        <p>NudgeMe AI · Mindfultalk Consulting LLP</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-on-surface transition-colors">Privacy</a>
          <a href="#" className="hover:text-on-surface transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}