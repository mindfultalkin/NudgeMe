import { useState } from 'react';
import Card from '../common/Card';
import Label from '../common/Label';
import Tag from '../common/Tag';
import Button from '../common/Button';
import Input from '../common/Input';
import { CHANNEL_ICONS } from '../../utils/constants';
import { wordCount, topicKey, formatDate } from '../../utils/helpers';
import { generateNudge, sendNudge } from '../../services/api';

export default function NudgeDashboardTab({ coachees, topics }) {
  const [nudges, setNudges] = useState({});
  const [loadingTopic, setLoadingTopic] = useState(null);
  const [channel, setChannel] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [allGenerating, setAllGenerating] = useState(false);
  const [editingNudge, setEditingNudge] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedCoachee, setSelectedCoachee] = useState('ALL');
  const [sending, setSending] = useState({});

  const filteredTopics = selectedCoachee === 'ALL' 
    ? topics 
    : topics.filter((t) => t.coacheeName === selectedCoachee);
  
  const coacheeNames = ['ALL', ...Array.from(new Set(coachees.map((c) => c.coacheeName)))];

  const handleGenerate = async (topicObj) => {
    const key = topicKey(topicObj);
    setLoadingTopic(key);
    try {
      const nudge = await generateNudge(topicObj.topic, topicObj.coacheeName);
      setNudges((prev) => ({ ...prev, [key]: nudge }));
    } catch (e) {
      setNudges((prev) => ({ ...prev, [key]: '⚠ Failed to generate.' }));
    }
    setLoadingTopic(null);
  };

  const handleGenerateAll = async () => {
    setAllGenerating(true);
    for (const t of filteredTopics) {
      setLoadingTopic(topicKey(t));
      try {
        const nudge = await generateNudge(t.topic, t.coacheeName);
        setNudges((prev) => ({ ...prev, [topicKey(t)]: nudge }));
      } catch (e) {
        // Continue with next
      }
    }
    setLoadingTopic(null);
    setAllGenerating(false);
  };

  const handleSend = async (topicObj) => {
    const key = topicKey(topicObj);
    const nudge = nudges[key];
    if (!nudge) return;

    const ch = channel[key] || 'Email';
    const coachee = coachees.find((c) => c.coacheeName === topicObj.coacheeName);
    const destination = ch === 'Email' ? coachee?.email : coachee?.phone;

    setSending((prev) => ({ ...prev, [key]: true }));
    try {
      const result = await sendNudge({
        coacheeName: topicObj.coacheeName,
        topic: topicObj.topic,
        nudge,
        channel: ch,
        destination,
        coach: topicObj.coach,
      });
      if (result.success) {
        setNudges((prev) => ({ ...prev, [key + '::sent']: true }));
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (err) {
      alert(`Server error: ${err.message}`);
    }
    setSending((prev) => ({ ...prev, [key]: false }));
  };

  const handleCopy = (nudge, key) => {
    navigator.clipboard.writeText(nudge);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div>
      {/* Filter & Actions */}
      <Card className="mb-6 border-l-4 border-primary">
        <div className="flex flex-wrap gap-6 items-center">
          <Label>Filter by Coachee</Label>
          <div className="flex gap-1 flex-wrap">
            {coacheeNames.map((name) => (
              <Button
                key={name}
                size="sm"
                variant={selectedCoachee === name ? 'primary' : 'ghost'}
                onClick={() => setSelectedCoachee(name)}
              >
                {name}
                {name !== 'ALL' && (
                  <span className="ml-1" style={{ color: selectedCoachee === name ? '#c9a84c' : '#aaa', fontSize: '0.65rem' }}>
                    ({topics.filter((t) => t.coacheeName === name).length})
                  </span>
                )}
              </Button>
            ))}
          </div>
          <div className="ml-auto">
            <Button
              variant={allGenerating ? 'ghost' : 'dark'}
              onClick={handleGenerateAll}
              disabled={allGenerating}
            >
              {allGenerating ? 'Generating...' : `Generate All (${filteredTopics.length})`}
            </Button>
          </div>
        </div>
      </Card>

      {/* Topics List */}
      <div className="grid gap-4">
        {filteredTopics.map((t) => {
          const key = topicKey(t);
          const nudge = nudges[key];
          const isLoading = loadingTopic === key;
          const isSent = nudges[key + '::sent'];
          const words = wordCount(nudge);
          const ch = channel[key] || 'Email';

          return (
            <Card
              key={key}
              className={`transition-opacity duration-300 ${isSent ? 'opacity-70' : ''}`}
            >
              <div className="flex justify-between items-start flex-wrap gap-4">
                {/* Left Side */}
                <div className="flex-1 min-w-[200px]">
                  {/* Tags */}
                  <div className="flex gap-2 mb-1 flex-wrap">
                    {t.date && <Tag>{formatDate(t.date)}</Tag>}
                    <Tag>{t.coacheeName} · {t.coach}</Tag>
                    {isSent && <Tag variant="success">✓ Sent</Tag>}
                  </div>
                  
                  {/* Topic */}
                  <div className="text-lg font-bold mb-3">{t.topic}</div>
                  
                  {/* Nudge */}
                  {nudge ? (
                    editingNudge === key ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          className="flex-1 italic"
                        />
                        <Button size="sm" onClick={() => { setNudges((p) => ({ ...p, [key]: editValue })); setEditingNudge(null); }}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingNudge(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="flex-1 italic text-base text-gray-700 border-l-2 border-primary pl-3 leading-relaxed">
                          {nudge}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Tag variant={words > 20 ? 'danger' : 'success'}>{words}w</Tag>
                          <Button size="sm" variant="ghost" onClick={() => handleCopy(nudge, key)}>
                            {copiedKey === key ? '✓' : 'Copy'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingNudge(key); setEditValue(nudge); }}>
                            Edit
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-sm text-gray-400 italic">
                      {isLoading ? 'Generating nudge...' : 'No nudge generated yet.'}
                    </div>
                  )}
                </div>

                {/* Right Side - Actions */}
                <div className="flex flex-col gap-2 items-end min-w-[160px]">
                  <Button
                    variant={nudge ? 'ghost' : 'dark'}
                    disabled={isLoading || allGenerating}
                    onClick={() => handleGenerate(t)}
                    style={{ opacity: isLoading ? 0.6 : 1 }}
                  >
                    {isLoading ? 'Generating...' : nudge ? 'Regenerate' : 'Generate Nudge'}
                  </Button>
                  
                  {nudge && !isSent && (
                    <div className="flex gap-1 items-center">
                      <select
                        value={ch}
                        onChange={(e) => setChannel((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="border border-border rounded-sm px-2 py-1 text-xs bg-white"
                      >
                        {['Email', 'WhatsApp'].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSend(t)}
                        disabled={sending[key]}
                        style={{ opacity: sending[key] ? 0.6 : 1 }}
                      >
                        {sending[key] ? 'Sending...' : `Send ${CHANNEL_ICONS[ch]}`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Guardrails Info */}
      <div className="mt-6 p-4 bg-gray-100 border border-border rounded-sm text-xs text-muted">
        <strong style={{ color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
          Active Guardrails
        </strong>
        <span className="ml-4">
          One sentence · Max 20 words · No frameworks · No emotional language · No session references · No new topics · No personality labels
        </span>
      </div>
    </div>
  );
}

