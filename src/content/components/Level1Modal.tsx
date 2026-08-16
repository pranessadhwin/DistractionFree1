import React from 'react';
import { formatSeconds } from '../../utils/time';

interface Level1ModalProps {
  plannedDurationSeconds: number;
  returnTask: string;
  goalTitle?: string;
  onExit: () => void;
  onContinue: () => void;
}

export const Level1Modal: React.FC<Level1ModalProps> = ({
  plannedDurationSeconds,
  returnTask,
  goalTitle,
  onExit,
  onContinue
}) => {
  return (
    <div className="ps-overlay-backdrop">
      <div className="ps-card">
        <div className="ps-header">
          <span className="ps-badge ps-badge-primary">Level 1 • Commitment</span>
        </div>

        <h1 className="ps-title">Planned break completed</h1>
        <p className="ps-subtitle">
          Your agreed {formatSeconds(plannedDurationSeconds)} break window is up.
        </p>

        <div className="ps-callout">
          <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your Agreed Next Task
          </span>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>
            {returnTask || 'Return to your priority work'}
          </p>
          {goalTitle && (
            <p style={{ fontSize: '13px', color: '#a5b4fc', marginTop: '6px' }}>
              Goal: {goalTitle}
            </p>
          )}
        </div>

        <div className="ps-button-group">
          <button className="ps-btn ps-btn-emerald" onClick={onExit} autoFocus>
            ✓ Close & Return to Task
          </button>
          <button className="ps-btn ps-btn-secondary" onClick={onContinue}>
            Continue (Record 1st Bypass)
          </button>
        </div>
      </div>
    </div>
  );
};
