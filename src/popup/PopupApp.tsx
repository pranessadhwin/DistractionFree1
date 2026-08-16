import React, { useEffect, useState } from 'react';
import { DistractionSession } from '../types/session';
import { AnalyticsSummary } from '../types/models';
import { formatSeconds } from '../utils/time';

export const PopupApp: React.FC = () => {
  const [session, setSession] = useState<DistractionSession | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [currentTabDomain, setCurrentTabDomain] = useState<string>('');

  const loadData = () => {
    chrome.runtime.sendMessage({ type: 'GET_ACTIVE_SESSION' }, (res) => {
      if (res && res.success && res.data) {
        setSession(res.data.session);
      }
    });

    chrome.runtime.sendMessage({ type: 'GET_DASHBOARD_DATA' }, (res) => {
      if (res && res.success && res.data) {
        setAnalytics(res.data.analytics);
      }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          setCurrentTabDomain(url.hostname.replace(/^www\./, ''));
        } catch {
          // ignore
        }
      }
    });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, []);

  const openDashboard = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('dashboard.html'));
    }
  };

  const handleStartQuickBreak = (durationSec: number) => {
    if (!currentTabDomain) return;
    chrome.runtime.sendMessage(
      {
        type: 'START_SHORT_BREAK',
        domain: currentTabDomain,
        plannedDurationSeconds: durationSec,
        returnTask: 'Resume focus after quick break'
      },
      () => {
        loadData();
      }
    );
  };

  const handleEndSession = () => {
    chrome.runtime.sendMessage(
      {
        type: 'INTERVENTION_ACTION',
        action: 'EXIT',
        interventionType: 'COMMITMENT_REMINDER'
      },
      () => {
        loadData();
      }
    );
  };

  const remainingSeconds = session
    ? Math.max(0, session.plannedDurationSeconds - session.actualActiveSeconds)
    : 0;

  const overrunSeconds = session
    ? Math.max(0, session.actualActiveSeconds - session.plannedDurationSeconds)
    : 0;

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-logo">
          <div className="popup-logo-icon">⏳</div>
          <span className="popup-title">Past-Self</span>
        </div>
        <button
          className="popup-btn popup-btn-secondary"
          style={{ width: 'auto', padding: '4px 10px', fontSize: '11px' }}
          onClick={openDashboard}
        >
          Dashboard ↗
        </button>
      </div>

      {/* Active Break Card */}
      {session && session.state !== 'ENDED' ? (
        <div className="popup-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              className={`popup-status-badge ${
                overrunSeconds > 0 ? 'badge-warning' : 'badge-active'
              }`}
            >
              {session.state === 'BREAK_ACTIVE'
                ? 'Break Active'
                : session.state === 'LIMIT_REACHED'
                ? 'Limit Reached'
                : 'Bypassed'}
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{session.siteDomain}</span>
          </div>

          <div className="timer-display">
            {overrunSeconds > 0 ? `+${formatSeconds(overrunSeconds)}` : formatSeconds(remainingSeconds)}
          </div>

          <p className="timer-subtext">
            {overrunSeconds > 0
              ? `Overrun past planned ${formatSeconds(session.plannedDurationSeconds)}`
              : `Remaining of ${formatSeconds(session.plannedDurationSeconds)} break`}
          </p>

          {session.returnTask && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 10px',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#cbd5e1'
              }}
            >
              Next: <strong>{session.returnTask}</strong>
            </div>
          )}

          <div style={{ marginTop: '14px' }}>
            <button className="popup-btn popup-btn-primary" onClick={handleEndSession}>
              ✓ Finish Break & Return
            </button>
          </div>
        </div>
      ) : (
        <div className="popup-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="popup-status-badge badge-idle">No Active Break</span>
            {currentTabDomain && (
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{currentTabDomain}</span>
            )}
          </div>

          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '12px 0' }}>
            Ready to take a planned, bounded break on this site?
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="popup-btn popup-btn-primary"
              onClick={() => handleStartQuickBreak(300)}
            >
              Start 5m Break
            </button>
            <button
              className="popup-btn popup-btn-secondary"
              onClick={() => handleStartQuickBreak(600)}
            >
              Start 10m Break
            </button>
          </div>
        </div>
      )}

      {/* Analytics Snapshot */}
      {analytics && (
        <div className="popup-card">
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
            Today's Adherence
          </span>
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-val" style={{ color: '#34d399' }}>
                {Math.round(analytics.intentionAdherenceRate * 100)}%
              </div>
              <div className="stat-lbl">Kept Limit</div>
            </div>
            <div className="stat-item">
              <div className="stat-val" style={{ color: '#a5b4fc' }}>
                {formatSeconds(analytics.averageOverrunSeconds)}
              </div>
              <div className="stat-lbl">Avg Overrun</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
