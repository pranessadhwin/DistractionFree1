import React, { useState } from 'react';
import { WorthItRating } from '../../types/session';

interface ReflectionModalProps {
  onSave: (worthIt: WorthItRating, feelingText: string, saveAsMessage: boolean) => void;
  onSkip: () => void;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({ onSave, onSkip }) => {
  const [rating, setRating] = useState<WorthItRating>('NO');
  const [feelingText, setFeelingText] = useState<string>('');
  const [saveAsMessage, setSaveAsMessage] = useState<boolean>(true);

  return (
    <div className="ps-overlay-backdrop">
      <div className="ps-card">
        <div className="ps-header">
          <span className="ps-badge ps-badge-primary">Post-Session Reflection</span>
        </div>

        <h1 className="ps-title">Was continuing worth it?</h1>
        <p className="ps-subtitle">
          Capture your mindset right now while it's fresh.
        </p>

        <div className="ps-rating-chips">
          <button
            type="button"
            className={`ps-rating-chip ${rating === 'YES' ? 'active-yes' : ''}`}
            onClick={() => setRating('YES')}
          >
            👍 Yes
          </button>
          <button
            type="button"
            className={`ps-rating-chip ${rating === 'NEUTRAL' ? 'active-neutral' : ''}`}
            onClick={() => setRating('NEUTRAL')}
          >
            😐 Neutral
          </button>
          <button
            type="button"
            className={`ps-rating-chip ${rating === 'NO' ? 'active-no' : ''}`}
            onClick={() => setRating('NO')}
          >
            👎 No, Regret
          </button>
        </div>

        <div className="ps-field-group">
          <label className="ps-label">What should future you remember when temptation strikes?</label>
          <textarea
            className="ps-textarea"
            placeholder="e.g. Next time, remember that extra 20 mins made me feel behind on my project..."
            value={feelingText}
            onChange={(e) => setFeelingText(e.target.value)}
            rows={3}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="ps-save-msg"
            checked={saveAsMessage}
            onChange={(e) => setSaveAsMessage(e.target.checked)}
            style={{ accentColor: '#6366f1', width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="ps-save-msg" style={{ fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
            Save this note as a future past-self intervention message
          </label>
        </div>

        <div className="ps-button-group">
          <button
            className="ps-btn ps-btn-primary"
            onClick={() => onSave(rating, feelingText, saveAsMessage)}
          >
            ✓ Complete Reflection
          </button>
          <button className="ps-btn ps-btn-ghost" onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
