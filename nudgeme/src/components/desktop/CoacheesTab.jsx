import { useState } from 'react';
import Card from '../common/Card';
import Label from '../common/Label';
import Tag from '../common/Tag';
import Button from '../common/Button';
import { formatDateShort } from '../../utils/helpers';
import { queueNudge, updateSchedule } from '../../services/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Generate time options: 6:00 AM to 10:00 PM in 30-min steps
const TIME_OPTIONS = [];
for (let h = 6; h <= 22; h++) {
  for (let m of [0, 30]) {
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const label = `${hour12}:${m === 0 ? '00' : '30'} ${ampm}`;
    const value = `${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`;
    TIME_OPTIONS.push({ label, value });
  }
}

const timeLabel = (val) => TIME_OPTIONS.find((t) => t.value === val)?.label || val;

export default function CoacheesTab({ coachees, topics, schedule, onScheduleUpdate }) {
  const [selected, setSelected] = useState(coachees[0]?.coacheeName || '');
  const [queueing, setQueueing] = useState(false);
  const [queued, setQueued] = useState({});
  const [localSchedule, setLocalSchedule] = useState(schedule);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Bulk schedule state ──
  const [bulkChannel, setBulkChannel] = useState('WhatsApp');
  const [bulkFrequency, setBulkFrequency] = useState('daily');
  const [bulkTime, setBulkTime] = useState('09:00');
  const [bulkDay, setBulkDay] = useState('monday');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState(false);

  const coachee = coachees.find((c) => c.coacheeName === selected);
  const coacheeTopics = topics.filter((t) => t.coacheeName === selected);

  // Find or create schedule entry for selected coachee
  const schedEntry = localSchedule.find((s) => s.coacheeName === selected) || {
    coacheeName: selected,
    active: false,
    channel: 'Email',
    frequency: 'daily',
    sendTime: '09:00',
    sendDay: 'monday',
    email: coachee?.email || '',
    phone: coachee?.phone || '',
    topics: coacheeTopics.map((t) => t.topic),
    lastTopicIndex: -1,
  };

  const isNewEntry = !localSchedule.find((s) => s.coacheeName === selected);
  const activeCount = localSchedule.filter((s) => s.active).length;

  // ── Schedule All Coachees ──
  const handleScheduleAll = async () => {
    setBulkSaving(true);
    setBulkSuccess(false);

    const updatedSchedule = coachees.map((c) => {
      const existing = localSchedule.find((s) => s.coacheeName === c.coacheeName);
      const coacheeTopicList = topics
        .filter((t) => t.coacheeName === c.coacheeName)
        .map((t) => t.topic);
      return {
        ...(existing || {}),
        coacheeName: c.coacheeName,
        coach: c.coach,
        email: c.email,
        phone: c.phone,
        topics: coacheeTopicList,
        channel: bulkChannel,
        frequency: bulkFrequency,
        sendTime: bulkTime,
        sendDay: bulkDay,
        active: true,
        lastTopicIndex: existing?.lastTopicIndex ?? -1,
      };
    });

    setLocalSchedule(updatedSchedule);
    await updateSchedule(updatedSchedule);
    onScheduleUpdate(updatedSchedule);
    setBulkSaving(false);
    setBulkSuccess(true);
    setTimeout(() => setBulkSuccess(false), 2500);
  };

  // ── Queue Nudge ──
  const handleQueueNudge = async (topic) => {
    if (!coachee) return;
    setQueueing(topic);
    try {
      await queueNudge({
        coacheeName: coachee.coacheeName,
        coach: coachee.coach,
        topic,
        channel: schedEntry?.channel || 'Email',
        email: coachee.email,
        phone: coachee.phone,
      });
      setQueued((prev) => ({ ...prev, [topic]: true }));
    } catch (e) {
      console.error('Error queueing nudge:', e);
    }
    setQueueing(false);
  };

  // ── Update Individual Schedule Field ──
  const updateScheduleField = (field, value) => {
    setLocalSchedule((prev) => {
      const exists = prev.find((s) => s.coacheeName === selected);
      if (exists) {
        return prev.map((s) => s.coacheeName === selected ? { ...s, [field]: value } : s);
      } else {
        return [...prev, { ...schedEntry, [field]: value }];
      }
    });
  };

  // ── Save Individual Schedule ──
  const handleSaveSchedule = async () => {
    setSaving(true);
    setSaveSuccess(false);
    let finalSchedule = localSchedule;
    if (isNewEntry) {
      finalSchedule = [...localSchedule, { ...schedEntry }];
      setLocalSchedule(finalSchedule);
    }
    await updateSchedule(finalSchedule);
    onScheduleUpdate(finalSchedule);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const currentEntry = localSchedule.find((s) => s.coacheeName === selected) || schedEntry;

  return (
    <div>

      {/* ══ BULK SCHEDULE ALL ══ */}
      <Card className="mb-6 border-l-4 border-primary">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Label>Schedule All Coachees at Once</Label>
            <div className="text-xs text-muted mt-1">
              Apply the same settings to all {coachees.length} coachees in one click
            </div>
          </div>
          <Tag variant={activeCount > 0 ? 'success' : 'default'}>
            {activeCount} / {coachees.length} active
          </Tag>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label className="mb-1">Channel</Label>
            <select
              value={bulkChannel}
              onChange={(e) => setBulkChannel(e.target.value)}
              className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {['Email', 'WhatsApp'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <Label className="mb-1">Frequency</Label>
            <select
              value={bulkFrequency}
              onChange={(e) => setBulkFrequency(e.target.value)}
              className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div>
            <Label className="mb-1">Send Time (IST)</Label>
            <select
              value={bulkTime}
              onChange={(e) => setBulkTime(e.target.value)}
              className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {bulkFrequency === 'weekly' && (
            <div>
              <Label className="mb-1">Send Day</Label>
              <select
                value={bulkDay}
                onChange={(e) => setBulkDay(e.target.value)}
                className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-xs text-muted italic bg-gray-50 rounded-sm p-2 mb-4">
          All {coachees.length} coachees will receive a nudge{' '}
          {bulkFrequency === 'daily'
            ? `every day at ${timeLabel(bulkTime)}`
            : `every ${bulkDay.charAt(0).toUpperCase() + bulkDay.slice(1)} at ${timeLabel(bulkTime)}`
          }, each rotating through their own topics.
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleScheduleAll} disabled={bulkSaving}>
            {bulkSaving ? 'Scheduling...' : `Apply to All ${coachees.length} Coachees`}
          </Button>
          {bulkSuccess && <Tag variant="success">✓ All {coachees.length} coachees scheduled!</Tag>}
        </div>
      </Card>

      {/* ══ INDIVIDUAL SCHEDULE ══ */}
      <div className="grid grid-cols-1 md:grid-cols-64 gap-6">

        {/* Sidebar */}
        <div>
          <Label className="mb-3">Individual Schedule</Label>
          {coachees.map((c) => {
            const entry = localSchedule.find((s) => s.coacheeName === c.coacheeName);
            const isActive = entry?.active;
            return (
              <div
                key={c.coacheeName}
                onClick={() => { setSelected(c.coacheeName); setQueued({}); }}
                className={`p-3 rounded-sm cursor-pointer mb-1 transition-all duration-150 ${
                  selected === c.coacheeName
                    ? 'bg-primary-dark text-primary-light'
                    : 'bg-white border border-border hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm">{c.coacheeName}</div>
                  {isActive && (
                    <span className="text-xs" style={{ color: selected === c.coacheeName ? '#c9a84c' : '#4a9a6a' }}>
                      ● Active
                    </span>
                  )}
                </div>
                <div className={`text-xs mt-0.5 ${selected === c.coacheeName ? 'text-gray-400' : 'text-muted'}`}>
                  {entry
                    ? `${timeLabel(entry.sendTime)} · ${entry.frequency} · ${entry.channel}`
                    : c.program
                  }
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        {coachee && (
          <div>
            {/* Coachee Details */}
            <Card className="mb-4 border-l-4 border-primary">
              <div className="flex flex-wrap gap-8">
                {[
                  { label: 'Coachee', val: coachee.coacheeName },
                  { label: 'Coach', val: coachee.coach },
                  { label: 'Program', val: coachee.program },
                  { label: 'Email', val: coachee.email },
                  { label: 'Phone', val: coachee.phone },
                ].map((field) => (
                  <div key={field.label}>
                    <Label>{field.label}</Label>
                    <div className="text-sm mt-1">{field.val || '—'}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Individual Schedule Settings */}
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <Label>Schedule — {coachee.coacheeName}</Label>
                {isNewEntry && <Tag variant="danger">Not configured yet — save to activate</Tag>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="mb-1">Channel</Label>
                  <select
                    value={currentEntry.channel}
                    onChange={(e) => updateScheduleField('channel', e.target.value)}
                    className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {['Email', 'WhatsApp'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="mb-1">Frequency</Label>
                  <select
                    value={currentEntry.frequency}
                    onChange={(e) => updateScheduleField('frequency', e.target.value)}
                    className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <Label className="mb-1">Send Time (IST)</Label>
                  <select
                    value={currentEntry.sendTime || '09:00'}
                    onChange={(e) => updateScheduleField('sendTime', e.target.value)}
                    className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {currentEntry.frequency === 'weekly' && (
                  <div>
                    <Label className="mb-1">Send Day</Label>
                    <select
                      value={currentEntry.sendDay || 'monday'}
                      onChange={(e) => updateScheduleField('sendDay', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <Label className="mb-1">Topic Rotation</Label>
                  <div className="border border-border rounded-sm px-3 py-2 text-sm bg-gray-50 text-muted">
                    Round-robin ({coacheeTopics.length} topics)
                  </div>
                </div>

                <div>
                  <Label className="mb-1">Status</Label>
                  <Button
                    size="sm"
                    variant={currentEntry.active ? 'success' : 'ghost'}
                    onClick={() => updateScheduleField('active', !currentEntry.active)}
                    className="w-full"
                  >
                    {currentEntry.active ? '● Active' : '○ Paused'}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted italic bg-gray-50 rounded-sm p-2 mb-4">
                {currentEntry.active
                  ? currentEntry.frequency === 'daily'
                    ? `Sends every day at ${timeLabel(currentEntry.sendTime || '09:00')}, rotating through ${coacheeTopics.length} topics`
                    : `Sends every ${currentEntry.sendDay ? currentEntry.sendDay.charAt(0).toUpperCase() + currentEntry.sendDay.slice(1) : 'Monday'} at ${timeLabel(currentEntry.sendTime || '09:00')}, rotating through ${coacheeTopics.length} topics`
                  : 'Scheduling paused for this coachee.'
                }
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSaveSchedule} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Schedule'}
                </Button>
                {saveSuccess && <Tag variant="success">✓ Saved</Tag>}
              </div>
            </Card>

            {/* Topics */}
            <Card>
              <Label className="mb-4">Topics ({coacheeTopics.length}) — Queue a Nudge for Approval</Label>
              <div className="grid gap-2">
                {coacheeTopics.map((t, i) => {
                  const isNext = (currentEntry.lastTopicIndex + 1) % coacheeTopics.length === i;
                  return (
                    <div key={t.topic} className="flex items-center gap-4 p-3 bg-surface-light rounded-sm">
                      {t.date && <Tag>{formatDateShort(t.date)}</Tag>}
                      <span className="flex-1 text-sm font-semibold">{t.topic}</span>
                      {isNext && currentEntry.active && <Tag variant="primary">Next up</Tag>}
                      {queued[t.topic] ? (
                        <Tag variant="success">✓ Queued</Tag>
                      ) : (
                        <Button
                          size="sm"
                          variant="dark"
                          onClick={() => handleQueueNudge(t.topic)}
                          disabled={queueing === t.topic}
                        >
                          {queueing === t.topic ? 'Queuing...' : 'Queue Nudge'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}