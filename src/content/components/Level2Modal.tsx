import React from 'react';
import { formatSeconds } from '../../utils/time';

interface Level2ModalProps {
  plannedDurationSeconds: number;
  actualActiveSeconds: number;
  evidenceStats?: {
    plannedMinutes: number;
    elapsedMinutes: number;
    similarSessionsCount: number;
    avgHistoricalOverrunMinutes: number;
  };
  returnTask: string;
  onExit: () => void;
  onContinue: () => void;
}

export const Level2Modal: React.FC<Level2ModalProps> = ({
  plannedDurationSeconds,
  actualActiveSeconds,
  evidenceStats,
  returnTask,
  onExit,
  onContinue
}) => {
  const overrunSec = Math.max(0, actualActiveSeconds - plannedDurationSeconds);

  return (
    <div className="ps-overlay-backdrop">
      <div className="ps-card">
        <div className="ps-header">
          <span className="ps-badge ps-badge-warning">Level 2 • Behavioral Evidence</span>
        </div>

        <h1 className="ps-title">Decision change detected</h1>
        <p className="ps-subtitle">
          Your intended boundary has expanded. Here is the observed data:
        </p>

        <div className="ps-stats-grid">
          <div className="ps-stat-box">
            <div className="ps-stat-box-val">{formatSeconds(plannedDurationSeconds)}</div>
            <div className="ps-stat-box-lbl">Planned Break</div>
          </div>
          <div className="ps-stat-box">
            <div className="ps-stat-box-val" style={{ color: '#f87171' }}>
              +{formatSeconds(overrunSec)}
            </div>
            <div className="ps-stat-box-lbl">Current Overrun</div>
          </div>
        </div>

        <div className="ps-callout ps-callout-warning">
          <p style={{ fontSize: '13.5px', color: '#fef3c7', lineHeight: 1.5 }}>
            {evidenceStats && evidenceStats.similarSessionsCount > 1 ? (
              <>
                In your last <strong>{evidenceStats.similarSessionsCount}</strong> similar sessions, continuing past this point led to an average overrun of <strong>+{evidenceStats.avgHistoricalOverrunMinutes} minutes</strong>.
              </>
            ) : (
              <>
                Continuing past this point usually turns a short pause into unplanned scrolling.
              </>
            )}
          </p>
          <div style={{ marginTop: '10px', fontSize: '13px', color: '#cbd5e1' }}>
            Next Task: <strong>{returnTask || 'Return to work'}</strong>
          </div>
        </div>

        <div className="ps-button-group">
          <button className="ps-btn ps-btn-emerald" onClick={onExit} autoFocus>
            ✓ Stop Here & Return
          </button>
          <button className="ps-btn ps-btn-secondary" onClick={onContinue}>
            Continue Anyway (2nd Bypass)
          </button>
        </div>
      </div>
    </div>
  );
};
