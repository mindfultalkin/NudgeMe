import { useState } from 'react';
import { approveNudge, rejectNudge, updateNudge } from '../../services/api';
import { wordCount } from '../../utils/helpers';

export default function ApprovalsTab({ queue, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal]     = useState('');
  const [processing, setProcessing] = useState({});

  const pending   = queue.filter(q => q.status === 'pending');
  const processed = queue.filter(q => q.status !== 'pending');

  const handleApprove = async (id) => {
    setProcessing(p => ({ ...p, [id]: 'approving' }));
    await approveNudge(id);
    setProcessing(p => ({ ...p, [id]: null }));
    onRefresh();
  };
  const handleReject = async (id) => {
    setProcessing(p => ({ ...p, [id]: 'rejecting' }));
    await rejectNudge(id);
    setProcessing(p => ({ ...p, [id]: null }));
    onRefresh();
  };
  const handleEdit = async (id) => {
    await updateNudge(id, editVal);
    setEditingId(null);
    onRefresh();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <section className="mb-12">
        <h2 className="font-serif text-5xl font-light text-on-surface leading-tight">
          Review your <span className="italic text-primary">coaching nudges</span>.
        </h2>
        <p className="text-outline mt-4 max-w-lg leading-relaxed">
          AI generated interventions based on recent sessions. Refine the voice or approve for immediate delivery.
        </p>
      </section>

      {/* Pending */}
      <section className="space-y-8 mb-16">
        <div className="flex items-baseline gap-4">
          <h3 className="text-xs uppercase tracking-[0.2em] text-outline font-bold">Pending Approval ({pending.length})</h3>
          <div className="h-px flex-1 bg-outline-variant/20" />
        </div>

        {pending.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant">check_circle</span>
            <p className="mt-4 text-on-surface-variant italic">All caught up — no nudges waiting for approval.</p>
          </div>
        )}

        {pending.map(item => {
          const words = wordCount(item.nudge);
          const isProc = processing[item.id];
          return (
            <div key={item.id} className="group bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="grid grid-cols-12">
                {/* Left */}
                <div className="col-span-4 p-8 bg-surface-container-low/50">
                  <div className="mb-6">
                    <h4 className="font-bold text-on-surface text-lg">{item.coacheeName}</h4>
                    <p className="text-xs text-outline">{item.coach || 'Coach'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded uppercase tracking-wider">{item.topic}</span>
                    <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">{item.channel === 'Email' ? 'mail' : 'chat'}</span>
                      {item.channel}
                    </span>
                    <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${words > 20 ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      {words}w
                    </span>
                  </div>
                  <p className="text-xs text-outline">{item.destination}</p>
                </div>

                {/* Right */}
                <div className="col-span-8 p-8 flex flex-col justify-between border-l border-outline-variant/10">
                  {editingId === item.id ? (
                    <div className="space-y-3 mb-6">
                      <textarea value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus
                        className="w-full bg-surface-container-high border-none rounded-xl text-sm p-4 focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none italic" />
                    </div>
                  ) : (
                    <p className="font-serif text-2xl italic leading-relaxed text-on-surface mb-6">
                      "{item.nudge}"
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => handleReject(item.id)} disabled={!!isProc}
                      className="px-4 py-2 text-sm font-bold text-outline hover:text-on-surface transition-colors">
                      {isProc === 'rejecting' ? 'Rejecting...' : 'Reject'}
                    </button>
                    {editingId === item.id ? (
                      <>
                        <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-bold text-outline">Cancel</button>
                        <button onClick={() => handleEdit(item.id)}
                          className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold">Save</button>
                      </>
                    ) : (
                      <button onClick={() => { setEditingId(item.id); setEditVal(item.nudge); }}
                        className="px-4 py-2 text-sm font-bold text-primary hover:bg-primary-fixed/30 rounded-lg transition-colors">Edit</button>
                    )}
                    {editingId !== item.id && (
                      <button onClick={() => handleApprove(item.id)} disabled={!!isProc}
                        className="bg-gradient-to-r from-primary to-primary-container px-6 py-2.5 text-sm font-bold text-on-primary rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60">
                        <span className="material-symbols-outlined text-sm">send</span>
                        {isProc === 'approving' ? 'Sending...' : 'Approve & Send'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Processed */}
      {processed.length > 0 && (
        <section>
          <div className="flex items-baseline gap-4 mb-8">
            <h3 className="text-xs uppercase tracking-[0.2em] text-outline font-bold">Recently Processed ({processed.length})</h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-container-low/30">
                  <th className="px-6 py-4 font-bold">Coachee</th>
                  <th className="px-6 py-4 font-bold">Nudge</th>
                  <th className="px-6 py-4 font-bold">Channel</th>
                  <th className="px-6 py-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {processed.slice(0, 10).map(item => (
                  <tr key={item.id} className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4 font-bold">{item.coacheeName}</td>
                    <td className="px-6 py-4 text-secondary truncate max-w-[240px]">{item.nudge?.substring(0,60)}...</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-xs text-outline">
                        <span className="material-symbols-outlined text-sm">{item.channel === 'Email' ? 'mail' : 'chat'}</span>
                        {item.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'sent'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'sent' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {item.status === 'sent' ? 'Sent' : 'Rejected'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}