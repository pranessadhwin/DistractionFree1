import React from 'react';

interface BackoffModalProps {
  returnTask: string;
  onExit: () => void;
  onDismiss: () => void;
}

export const BackoffModal: React.FC<BackoffModalProps> = ({
  returnTask,
  onExit,
  onDismiss
}) => {
  return (
    <div className="ps-overlay-backdrop">
      <div className="ps-card">
        <div className="ps-header">
          <span className="ps-badge ps-badge-primary">Autonomy Back-off</span>
        </div>

        <h1 className="ps-title">Decision acknowledged</h1>
        <p className="ps-subtitle">
          We respect your conscious choice to continue and will stop interrupting this session.
        </p>

        <div className="ps-callout">
          <p style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
            Whenever you are ready to switch, your next step is waiting:
          </p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#6ee7b7', marginTop: '6px' }}>
            {returnTask || 'Return to your priority work'}
          </p>
        </div>

        <div className="ps-button-group">
          <button className="ps-btn ps-btn-secondary" onClick={onDismiss} autoFocus>
            Continue Without Further Interruption
          </button>
          <button className="ps-btn ps-btn-emerald" onClick={onExit}>
            Switch to Task Now
          </button>
        </div>
      </div>
    </div>
  );
};
