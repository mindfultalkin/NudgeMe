import { useState } from 'react';
import { CHANNEL_ICONS } from '../../utils/constants';
import { wordCount } from '../../utils/helpers';
import { approveNudge, rejectNudge, updateNudge } from '../../services/api';

export default function MobApprovals({ queue, onRefresh }) {
  const [processing, setProcessing] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const pending = queue.filter((q) => q.status === 'pending');

  const handleApprove = async (id) => {
    setProcessing((p) => ({ ...p, [id]: 'approving' }));
    await approveNudge(id);
    setProcessing((p) => ({ ...p, [id]: null }));
    onRefresh();
  };

  const handleReject = async (id) => {
    setProcessing((p) => ({ ...p, [id]: 'rejecting' }));
    await rejectNudge(id);
    setProcessing((p) => ({ ...p, [id]: null }));
    onRefresh();
  };

  const handleEdit = async (id) => {
    await updateNudge(id, editValue);
    setEditingId(null);
    onRefresh();
  };

  return (
    <div className="p-4">
      <div className="text-2xl font-display text-primary-light mb-1">Approvals</div>
      <div className="text-sm text-gray-500 mb-4">{pending.length} waiting for review</div>

      {/* Empty State */}
      {pending.length === 0 ? (
        <div className="bg-surface-card border border-surface-cardBorder rounded-xl p-10 text-center">
          <div className="text-4xl mb-2">✓</div>
          <div className="text-green-500 font-semibold mb-1">All clear</div>
          <div className="text-gray-500 text-sm">No nudges pending approval</div>
        </div>
      ) : (
        pending.map((item) => {
          const words = wordCount(item.nudge);
          const isProcessing = processing[item.id];

          return (
            <div 
              key={item.id} 
              className="bg-surface-card border border-surface-cardBorder rounded-xl p-4 mb-4 border-l-2 border-primary"
            >
              {/* Tags */}
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="bg-surface-card text-gray-500 rounded-full px-2 py-0.5 text-xs">
                  {item.coacheeName}
                </span>
                <span className="bg-surface-card text-gray-500 rounded-full px-2 py-0.5 text-xs">
                  {CHANNEL_ICONS[item.channel]} {item.channel}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  words > 20 ? 'bg-red-900/20 text-red-500' : 'bg-green-900/20 text-green-500'
                }`}>
                  {words}w
                </span>
              </div>

              {/* Topic */}
              <div className="text-xs text-gray-500 mb-3">{item.topic}</div>

              {/* Edit Mode */}
              {editingId === item.id ? (
                <div className="mb-3">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className="w-full bg-surface-cardBorder border border-surface-cardBorder rounded-lg px-3 py-2 text-primary-light text-sm font-sans outline-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(item.id)}
                      className="flex-1 bg-primary text-primary-dark rounded-lg py-2 text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 bg-surface-card text-gray-500 rounded-lg py-2 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="italic text-sm text-gray-200 border-l-2 border-primary pl-3 leading-relaxed mb-2">
                    {item.nudge}
                  </div>
                  <div className="text-xs text-gray-600 mb-3">→ {item.destination}</div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingId(item.id); setEditValue(item.nudge); }}
                  className="flex-1 bg-surface-card text-gray-500 rounded-lg py-2 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  disabled={!!isProcessing}
                  className="flex-1 bg-surface-card text-red-500 rounded-lg py-2 text-sm font-medium border border-red-900"
                >
                  {isProcessing === 'rejecting' ? '...' : '✗ Reject'}
                </button>
                <button
                  onClick={() => handleApprove(item.id)}
                  disabled={!!isProcessing}
                  className={`flex-2 bg-green-600 text-white rounded-lg py-2 text-sm font-semibold ${
                    isProcessing ? 'opacity-60' : ''
                  }`}
                >
                  {isProcessing === 'approving' ? 'Sending...' : '✓ Approve & Send'}
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Recently Processed */}
      {queue.filter((q) => q.status !== 'pending').length > 0 && (
        <>
          <div className="text-xs tracking-widest uppercase text-gray-500 mt-6 mb-3">Recently Processed</div>
          {queue.filter((q) => q.status !== 'pending').slice(0, 5).map((item) => (
            <div 
              key={item.id} 
              className={`bg-surface-card border border-surface-cardBorder rounded-xl p-3 mb-2 opacity-55 border-l-2 ${
                item.status === 'sent' ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="flex gap-2 items-center">
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  item.status === 'sent' 
                    ? 'bg-green-900/20 text-green-500' 
                    : 'bg-red-900/20 text-red-500'
                }`}>
                  {item.status === 'sent' ? '✓ Sent' : '✗ Rejected'}
                </span>
                <span className="text-xs text-gray-500">{item.coacheeName} · {item.topic}</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

