import { useState } from 'react';
import Card from '../common/Card';
import Label from '../common/Label';
import Tag from '../common/Tag';
import Button from '../common/Button';
import Input from '../common/Input';
import { CHANNEL_ICONS } from '../../utils/constants';
import { wordCount } from '../../utils/helpers';
import { approveNudge, rejectNudge, updateNudge } from '../../services/api';

export default function ApprovalsTab({ queue, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [processing, setProcessing] = useState({});

  const pending = queue.filter((q) => q.status === 'pending');
  const processed = queue.filter((q) => q.status !== 'pending');

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
    <div>
      <Label className="mb-3">Pending Approval ({pending.length})</Label>
      
      {pending.length === 0 && (
        <Card className="mb-6 text-gray-400 italic text-sm">
          No nudges waiting for approval.
        </Card>
      )}

      <div className="grid gap-3 mb-8">
        {pending.map((item) => {
          const words = wordCount(item.nudge);
          const isProcessing = processing[item.id];

          return (
            <Card key={item.id} className="border-l-4 border-primary">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                <Tag>{item.coacheeName}</Tag>
                <Tag>{item.topic}</Tag>
                <Tag>{CHANNEL_ICONS[item.channel]} {item.channel}</Tag>
                <Tag>{item.destination}</Tag>
                <Tag variant={words > 20 ? 'danger' : 'success'}>{words}w</Tag>
              </div>

              {/* Nudge Text */}
              {editingId === item.id ? (
                <div className="flex gap-2 items-center mb-3">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className="flex-1 italic"
                  />
                  <Button size="sm" onClick={() => handleEdit(item.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              ) : (
                <div className="italic text-base text-gray-700 border-l-2 border-primary pl-3 mb-3">
                  {item.nudge}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(item.id);
                    setEditValue(item.nudge);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!!isProcessing}
                  onClick={() => handleReject(item.id)}
                >
                  {isProcessing === 'rejecting' ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  disabled={!!isProcessing}
                  onClick={() => handleApprove(item.id)}
                >
                  {isProcessing === 'approving' ? 'Sending...' : 'Approve & Send ✓'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recently Processed */}
      {processed.length > 0 && (
        <>
          <Label className="mb-3">Recently Processed ({processed.length})</Label>
          <div className="grid gap-2">
            {processed.slice(0, 10).map((item) => (
              <Card
                key={item.id}
                className={`py-3 px-4 opacity-70 border-l-4 ${
                  item.status === 'sent' ? 'border-success' : 'border-warning'
                }`}
              >
                <div className="flex gap-3 items-center flex-wrap">
                  <Tag variant={item.status === 'sent' ? 'success' : 'danger'}>
                    {item.status === 'sent' ? '✓ Sent' : '✗ Rejected'}
                  </Tag>
                  <span className="font-bold text-sm">{item.coacheeName}</span>
                  <span className="text-sm text-muted">{item.topic}</span>
                  <span className="italic text-sm text-gray-500 flex-1">{item.nudge}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

