import { useState } from 'react';
import Card from '../common/Card';
import Label from '../common/Label';
import Tag from '../common/Tag';
import Button from '../common/Button';
import { formatDate } from '../../utils/helpers';

export default function HistoryTab({ history, coachees }) {
  const [filterCoachee, setFilterCoachee] = useState('ALL');
  
  const coacheeNames = ['ALL', ...Array.from(new Set(coachees.map((c) => c.coacheeName)))];
  const filtered = filterCoachee === 'ALL' 
    ? history 
    : history.filter((h) => h.coacheeName === filterCoachee);

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-1 flex-wrap mb-6 items-center">
        <Label className="mr-2">Filter:</Label>
        {coacheeNames.map((name) => (
          <Button
            key={name}
            size="sm"
            variant={filterCoachee === name ? 'primary' : 'ghost'}
            onClick={() => setFilterCoachee(name)}
          >
            {name}
            {name !== 'ALL' && (
              <span className="ml-1" style={{ color: filterCoachee === name ? '#c9a84c' : '#aaa' }}>
                ({history.filter((h) => h.coacheeName === name).length})
              </span>
            )}
          </Button>
        ))}
        <span className="ml-auto">
          <Label>{filtered.length} nudge{filtered.length !== 1 ? 's' : ''}</Label>
        </span>
      </div>

      {filtered.length === 0 && (
        <Card className="text-gray-400 italic">No nudges sent yet.</Card>
      )}

      {/* History List */}
      <div className="grid gap-2">
        {filtered.map((h, i) => (
          <Card key={i} className="py-3 px-5 border-l-4 border-success">
            <div className="flex gap-3 flex-wrap mb-1 items-center">
              <span className="font-bold text-sm">{h.coacheeName}</span>
              <Tag>{h.topic}</Tag>
              <span className="ml-auto text-xs text-gray-300">
                {formatDate(h.sentAt)}
              </span>
            </div>
            <div className="italic text-sm text-gray-700 border-l-2 border-success pl-3">
              {h.nudge}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

