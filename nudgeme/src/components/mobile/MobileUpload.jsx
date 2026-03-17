import { useState, useCallback } from 'react';

export default function MobileUpload({ onUpload, error }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert('Please upload an Excel file');
      return;
    }
    onUpload(file);
  }, [onUpload]);

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-6 font-sans">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-xs tracking-widest uppercase text-primary mb-2">AI Coaching Agent</div>
        <h1 className="text-4xl font-normal font-display text-primary-light leading-tight">
          NudgeMe
        </h1>
        <p className="mt-2 text-sm text-gray-500 italic font-display">
          One line. One practice. One step forward.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => document.getElementById('mob-upload').click()}
        className={`w-full max-w-sm border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragging ? 'border-primary bg-amber-900/20' : 'border-gray-800 bg-zinc-900'
        }`}
      >
        <div className="text-5xl mb-3">📊</div>
        <div className="text-primary-light font-medium mb-1">Upload your Excel file</div>
        <div className="text-sm text-gray-500 mb-5">.xlsx files only</div>
        <div className="inline-block bg-primary text-primary-dark px-5 py-2 text-sm font-semibold rounded-lg">
          Choose File
        </div>
        <input
          id="mob-upload"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 text-sm text-warning text-center bg-red-900/20 border border-red-800 rounded-lg p-3 max-w-sm">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

