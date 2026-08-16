import React from 'react';
import { AnalyticsSummary, StorageData } from '../../types/models';
import { formatSeconds } from '../../utils/time';

interface AnalyticsTabProps {
  analytics: AnalyticsSummary;
  data: StorageData;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ analytics, data }) => {
  const adherencePercent = Math.round(analytics.intentionAdherenceRate * 100);
  const firstReminderPercent = Math.round(analytics.stoppedAtFirstReminderRate * 100);
  const repeatedBypassPercent = Math.round(analytics.repeatedBypassRate * 100);
  const regretPercent = Math.round(analytics.regretRate * 100);

  return (
    <div>
      <div className="dash-page-header">
        <h1 className="dash-page-title">Intention & Adherence Insights</h1>
        <p className="dash-page-subtitle">
          Observed behavioral data across all intention-bounded sessions.
        </p>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="dash-grid-4">
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Intention Adherence</span>
            <span className="badge badge-emerald">Within Limit</span>
          </div>
          <div className="dash-metric-value" style={{ color: '#34d399' }}>
            {adherencePercent}%
          </div>
          <div className="dash-metric-subtext">
            {analytics.totalSessions} total recorded sessions
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Average Overrun</span>
            <span className="badge badge-amber">Gap</span>
          </div>
          <div className="dash-metric-value" style={{ color: '#fbbf24' }}>
            +{formatSeconds(analytics.averageOverrunSeconds)}
          </div>
          <div className="dash-metric-subtext">
            Actual vs planned duration
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">First-Reminder Exit</span>
            <span className="badge badge-indigo">Decision 1</span>
          </div>
          <div className="dash-metric-value" style={{ color: '#a5b4fc' }}>
            {firstReminderPercent}%
          </div>
          <div className="dash-metric-subtext">
            Stopped at 1st commitment prompt
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Post-Session Regret</span>
            <span className="badge badge-rose">Reflections</span>
          </div>
          <div className="dash-metric-value" style={{ color: '#f87171' }}>
            {regretPercent}%
          </div>
          <div className="dash-metric-subtext">
            Marked "Not worth it" afterwards
          </div>
        </div>
      </div>

      {/* Grid 2: Intention vs Actual Time & Decision Point Funnel */}
      <div className="dash-grid-2">
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Cumulative Time Distribution</span>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span>Planned Intended Time</span>
              <strong style={{ color: '#6ee7b7' }}>{formatSeconds(analytics.totalPlannedSeconds)}</strong>
            </div>
            <div className="dash-progress-track">
              <div
                className="dash-progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    analytics.totalActualSeconds > 0
                      ? (analytics.totalPlannedSeconds / analytics.totalActualSeconds) * 100
                      : 100
                  )}%`,
                  background: '#10b981'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span>Actual Active Time</span>
              <strong style={{ color: '#f87171' }}>{formatSeconds(analytics.totalActualSeconds)}</strong>
            </div>
            <div className="dash-progress-track">
              <div
                className="dash-progress-fill"
                style={{ width: '100%', background: '#ef4444' }}
              />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '14px' }}>
            Active tab time excludes background tabs and device sleep.
          </p>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Decision Point Funnel</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>1. Stopped at Planned Limit (Level 1)</span>
                <strong>{firstReminderPercent}%</strong>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>2. Continued Once (Level 2 Evidence)</span>
                <strong>{Math.max(0, 100 - firstReminderPercent)}%</strong>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>3. Repeated Bypass (&gt;= 2 Continuations)</span>
                <strong style={{ color: '#f87171' }}>{repeatedBypassPercent}%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2: Intervention Effectiveness & Intention Types */}
      <div className="dash-grid-2">
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Intervention Ladder Exit Rates</span>
          </div>
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Intervention Level</th>
                  <th>Shown</th>
                  <th>Exited</th>
                  <th>Exit Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.interventionEffectiveness).map(([type, stats]) => (
                  <tr key={type}>
                    <td>
                      <strong>
                        {type === 'COMMITMENT_REMINDER'
                          ? 'Level 1: Commitment'
                          : type === 'BEHAVIOR_EVIDENCE'
                          ? 'Level 2: Evidence'
                          : type === 'PAST_SELF_MESSAGE'
                          ? 'Level 3: Past-Self'
                          : type}
                      </strong>
                    </td>
                    <td>{stats.shown}</td>
                    <td>{stats.exited}</td>
                    <td>
                      <span
                        className={`badge ${
                          stats.rate >= 0.5 ? 'badge-emerald' : 'badge-amber'
                        }`}
                      >
                        {Math.round(stats.rate * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Intention Breakdown</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(analytics.sessionsByIntention).map(([intent, count]) => (
              <div key={intent} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span style={{ color: '#cbd5e1' }}>
                  {intent === 'SHORT_BREAK'
                    ? '☕ Short Break'
                    : intent === 'AUTOMATIC_OPEN'
                    ? '⚡ Automatic Open'
                    : intent === 'SPECIFIC_TASK'
                    ? '🎯 Specific Task'
                    : '🛡️ Avoidance Re-entry'}
                </span>
                <strong>{count} sessions</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
