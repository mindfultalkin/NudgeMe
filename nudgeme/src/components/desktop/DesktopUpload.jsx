import { useState, useCallback } from 'react';

export default function DesktopUpload({ onUpload, error }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    onUpload(file);
  }, [onUpload]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="min-h-screen bg-surface-light flex flex-col items-center justify-center font-serif text-primary-dark p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-xs tracking-widest uppercase text-primary mb-2">AI Coaching Agent</div>
        <h1 className="text-4xl font-normal tracking-tighter m-0">NudgeMe</h1>
        <p className="mt-2 text-muted italic">One line. One practice. One step forward.</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('desk-upload').click()}
        className={`w-full max-w-md border-2 border-dashed rounded-md p-12 text-center cursor-pointer transition-all duration-200 ${
          dragging ? 'border-primary bg-amber-50' : 'border-gray-300 bg-white'
        }`}
      >
        <div className="text-4xl mb-4">📊</div>
        <div className="font-bold mb-2">Drop your Excel file here</div>
        <div className="text-sm text-muted mb-6">or click to browse · .xlsx files only</div>
        <div className="inline-block bg-primary-dark text-primary-light px-6 py-2 text-sm tracking-widest uppercase rounded-sm">
          Choose File
        </div>
        <input
          id="desk-upload"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 text-sm text-warning max-w-md text-center bg-red-50 border border-red-200 rounded-sm p-3">
          ⚠ {error}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 max-w-md text-xs text-gray-400 leading-relaxed">
        <div className="font-medium tracking-widest uppercase text-gray-500 mb-2">Expected Excel Format</div>
        <div className="mb-1">Sheet 1 — <em>Coachee Details:</em> Coach · Coachee Name · Program · Coachee Phone No. · Coachee Email</div>
        <div>Sheet 2 — <em>Topics Covered:</em> Date · Topic · Coach · Coachee Name</div>
      </div>
    </div>
  );
}

