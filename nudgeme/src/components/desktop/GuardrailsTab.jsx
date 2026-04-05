import { useState, useEffect } from 'react';
import { SERVER } from '../../utils/constants';

const DEFAULT_GUARDRAILS = {
  _default: `- Exactly ONE sentence. No more.
- Maximum 20 words.
- Action-oriented or awareness-based.
- Plain language only.
- No emojis, no formatting.
- No coaching theory or frameworks.
- No emotional or therapeutic language.
- No references to sessions, coaching, or past discussions.
- No personality labels or emotional assumptions.
- Do not introduce new topics.`,
};

export default function GuardrailsTab({ topics }) {
  const [guardrails, setGuardrails] = useState(DEFAULT_GUARDRAILS);
  const [selected, setSelected]     = useState('_default');
  const [editVal, setEditVal]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [saveOk, setSaveOk]         = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch(`${SERVER}/api/guardrails`)
      .then(r => r.json())
      .then(d => { if (d.guardrails) setGuardrails(d.guardrails); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setEditVal(guardrails[selected] || '');
  }, [selected, guardrails]);

  const handleSave = async () => {
    setSaving(true); setSaveOk(false);
    const updated = { ...guardrails, [selected]: editVal };
    try {
      await fetch(`${SERVER}/api/guardrails`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guardrails: updated }),
      });
      setGuardrails(updated);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    } catch(e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  const handleReset = () => {
    setEditVal(guardrails['_default'] || DEFAULT_GUARDRAILS['_default']);
  };

  const allTopics = ['_default', ...topics];

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mb-10">
        <h2 className="font-serif text-4xl text-on-surface mb-2">Guardrails</h2>
        <p className="text-on-surface-variant text-lg italic opacity-80">
          Set the rules Claude follows when generating nudges for each topic. The default applies to all topics unless overridden.
        </p>
      </section>

      <div className="grid grid-cols-12 gap-8">
        {/* Topic list */}
        <aside className="col-span-4">
          <p className="text-xs font-bold uppercase text-outline tracking-widest mb-3">Topics</p>
          <div className="space-y-1">
            {allTopics.map(topic => {
              const hasCustom = !!guardrails[topic] && topic !== '_default';
              const isSel = selected === topic;
              return (
                <button key={topic} onClick={() => setSelected(topic)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                    isSel ? 'bg-primary text-on-primary font-bold shadow-sm' : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="truncate">{topic === '_default' ? '⚙ Default (all topics)' : topic}</span>
                    {hasCustom && !isSel && (
                      <span className="text-[9px] bg-tertiary-fixed text-on-tertiary-fixed px-1.5 py-0.5 rounded uppercase font-bold flex-shrink-0 ml-2">Custom</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Editor */}
        <div className="col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-on-surface">
                {selected === '_default' ? 'Default Guardrails' : selected}
              </p>
              <p className="text-xs text-outline mt-0.5">
                {selected === '_default'
                  ? 'Applied to all topics unless overridden'
                  : 'Custom rules for this topic only — overrides default'}
              </p>
            </div>
            {selected !== '_default' && (
              <button onClick={handleReset}
                className="text-xs text-outline hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Use default
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center text-outline">Loading...</div>
          ) : (
            <textarea
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              rows={16}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none leading-relaxed"
              placeholder="Enter guardrail rules, one per line..."
            />
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-outline">
              Each rule on a new line. Claude reads these before generating nudges for this topic.
            </p>
            <div className="flex items-center gap-3">
              {saveOk && <span className="text-green-600 text-sm font-bold">✓ Saved</span>}
              <button onClick={handleSave} disabled={saving || loading}
                className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-bold shadow-lg hover:shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">save</span>
                {saving ? 'Saving...' : 'Save Guardrails'}
              </button>
            </div>
          </div>

          {/* Preview box */}
          <div className="bg-surface-container-low rounded-xl p-5 border-l-4 border-primary">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">How it works</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              When the coach clicks Generate for <strong>{selected === '_default' ? 'any topic' : selected}</strong>,
              Claude receives these rules as instructions before creating the nudge.
              Rules here <strong>add to or replace</strong> the built-in guardrails depending on the topic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}