import { useState, useEffect } from 'preact/hooks';
import { Passage } from '../../types/narrative';
import { validateNarrative } from '../../data/storyPassages';
import { Icon } from '../ui/Icon';

interface JsonTransferModalProps {
  isOpen: boolean;
  passages: Record<string, Passage>;
  onClose: () => void;
  onApply: (loaded: Record<string, Passage>) => void;
}

export function JsonTransferModal({
  isOpen,
  passages,
  onClose,
  onApply,
}: JsonTransferModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(passages, null, 2));
      setCopied(false);
    }
  }, [isOpen, passages]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Failed to copy to clipboard.');
    }
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const validated = validateNarrative(parsed);
      if (validated) {
        onApply(validated);
        onClose();
      } else {
        alert('Invalid narrative JSON structure: must contain passages with id, title, text, and choices.');
      }
    } catch (err) {
      alert(`JSON Parse Error: ${err}`);
    }
  };

  return (
    <div id="swap-modal-overlay" class="active">
      <div class="pixel-frame is-dark swap-modal-frame" style={{ maxWidth: '640px' }}>
        <div class="drawer-header">
          <span>
            <Icon name="book" /> IMPORT / EXPORT NARRATIVE JSON
          </span>
          <button type="button" class="pixel-btn btn-danger" onClick={onClose}>
            X
          </button>
        </div>
        <textarea
          class="pixel-input"
          rows={12}
          value={jsonText}
          onInput={(e) => setJsonText((e.target as HTMLTextAreaElement).value)}
          style={{ resize: 'vertical', width: '100%', marginBottom: '12px' }}
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button type="button" class="pixel-btn btn-primary" onClick={handleCopy}>
            {copied ? 'COPIED!' : 'COPY'}
          </button>
          <button type="button" class="pixel-btn btn-success" onClick={handleApply}>
            APPLY JSON
          </button>
        </div>
      </div>
    </div>
  );
}