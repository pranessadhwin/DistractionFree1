import React from 'react';
import { PastSelfMessage } from '../../types/models';
import { formatRelativeDate } from '../../utils/time';

interface Level3ModalProps {
  message: PastSelfMessage;
  returnTask: string;
  onExit: () => void;
  onContinue: () => void;
}

export const Level3Modal: React.FC<Level3ModalProps> = ({
  message,
  returnTask,
  onExit,
  onContinue
}) => {
  return (
    <div className="ps-overlay-backdrop">
      <div className="ps-card">
        <div className="ps-header">
          <span className="ps-badge ps-badge-danger">Level 3 • Past Self</span>
        </div>

        <h1 className="ps-title">A message from your past self</h1>
        <p className="ps-subtitle">
          Written during a moment of clarity for when temptation returns:
        </p>

        <div className="ps-callout ps-callout-quote">
          "{message.message}"
          <span className="ps-callout-quote-author">
            — Authored by you {message.createdAt ? `(${formatRelativeDate(message.createdAt)})` : ''}
          </span>
        </div>

        <div style={{ marginBottom: '20px', fontSize: '13px', color: '#94a3b8' }}>
          Target Task: <strong style={{ color: '#f8fafc' }}>{returnTask || 'Return to work'}</strong>
        </div>

        <div className="ps-button-group">
          <button className="ps-btn ps-btn-emerald" onClick={onExit} autoFocus>
            ✓ Listen to Past Me & Return
          </button>
          <button className="ps-btn ps-btn-secondary" onClick={onContinue}>
            Continue Consciously
          </button>
        </div>
      </div>
    </div>
  );
};
