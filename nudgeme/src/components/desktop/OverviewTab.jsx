import Card from '../common/Card';
import Label from '../common/Label';
import Tag from '../common/Tag';
import { formatDateShort } from '../../utils/helpers';

export default function OverviewTab({ coachees, topics, history, queue }) {
  const pending = queue.filter((q) => q.status === 'pending').length;
  const topicCoverage = topics.length > 0 
    ? Math.round((new Set(history.map((h) => h.topic)).size / topics.length) * 100) 
    : 0;

  const stats = [
    { label: 'Total Coachees', val: coachees.length, color: '#c9a84c' },
    { label: 'Topics Loaded', val: topics.length, color: '#c9a84c' },
    { label: 'Nudges Sent', val: history.length, color: '#4a9a6a' },
    { label: 'Pending Approval', val: pending, color: pending > 0 ? '#e05a2b' : '#888' },
    { label: 'Topic Coverage', val: `${topicCoverage}%`, color: '#4a9a6a' },
    { label: 'Active Coachees', val: new Set(history.map((h) => h.coacheeName)).size, color: '#c9a84c' },
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center p-4 bg-white border border-border rounded-sm">
            <div className="text-2xl font-bold" style={{ color: stat.color, lineHeight: 1 }}>
              {stat.val}
            </div>
            <Label className="mt-1">{stat.label}</Label>
          </div>
        ))}
      </div>

      {/* Coachee Breakdown */}
      <Card className="mb-4">
        <Label className="mb-4">Coachee Breakdown</Label>
        {coachees.map((c) => {
          const sent = history.filter((h) => h.coacheeName === c.coacheeName).length;
          const total = topics.filter((t) => t.coacheeName === c.coacheeName).length;
          const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
          
          return (
            <div key={c.coacheeName} className="flex items-center gap-4 py-3 border-b border-gray-100">
              <div className="w-32 font-bold text-sm">{c.coacheeName}</div>
              <div className="w-36 text-sm text-muted">{c.program}</div>
              <div className="flex-1 bg-gray-100 rounded-sm h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-sm transition-all duration-500" 
                  style={{ width: `${Math.min(pct, 100)}%` }} 
                />
              </div>
              <div className="w-20 text-sm text-muted text-right">{sent}/{total} topics</div>
              <Tag variant={pct === 100 ? 'success' : 'default'}>{pct}%</Tag>
            </div>
          );
        })}
      </Card>

      {/* Recent Activity */}
      <Card>
        <Label className="mb-4">Recent Activity</Label>
        {history.slice(0, 5).map((h, i) => (
          <div key={i} className="flex gap-4 items-start py-2 border-b border-gray-100">
            <Tag variant="success">✓ Sent</Tag>
            <div className="flex-1">
              <span className="font-bold text-sm">{h.coacheeName}</span>
              <span className="text-muted text-sm ml-2">· {h.topic}</span>
              <div className="italic text-sm text-gray-600 mt-1">{h.nudge}</div>
            </div>
            <div className="text-xs text-gray-300">{formatDateShort(h.sentAt)}</div>
          </div>
        ))}
        {history.length === 0 && (
          <div className="text-gray-400 italic text-sm">No nudges sent yet.</div>
        )}
      </Card>
    </div>
  );
}

