import React, { useState } from 'react';
import { DistractionSession, Reflection } from '../../types/session';
import { formatSeconds, formatRelativeDate, formatTimeRange } from '../../utils/time';

interface HistoryTabProps {
  sessions: DistractionSession[];
  reflections: Reflection[];
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ sessions, reflections }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.siteDomain.toLowerCase().includes(term) ||
      (s.returnTask && s.returnTask.toLowerCase().includes(term)) ||
      s.intentionType.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="dash-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="dash-page-title">Session History & Reflections</h1>
          <p className="dash-page-subtitle">
            Chronological record of planned versus actual behavior, bypasses, and retrospective evaluations.
          </p>
        </div>
        <input
          type="text"
          className="input-field"
          style={{ width: '240px' }}
          placeholder="Filter by domain or task..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredSessions.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#94a3b8' }}>No recorded distraction sessions yet.</p>
        </div>
      ) : (
        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Domain</th>
                <th>Intention</th>
                <th>Planned</th>
                <th>Actual Time</th>
                <th>Overrun</th>
                <th>Bypasses</th>
                <th>Judgment & Reflection</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => {
                const overrun = session.actualActiveSeconds - session.plannedDurationSeconds;
                const reflection = reflections.find((r) => r.sessionId === session.id);

                return (
                  <tr key={session.id}>
                    <td>
                      <div>{formatRelativeDate(session.startedAt)}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {formatTimeRange(session.startedAt, session.endedAt)}
                      </div>
                    </td>
                    <td>
                      <strong>{session.siteDomain}</strong>
                      {session.returnTask && (
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
                          Next: {session.returnTask}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-indigo">
                        {session.intentionType === 'SHORT_BREAK'
                          ? 'Break'
                          : session.intentionType === 'AUTOMATIC_OPEN'
                          ? 'Automatic'
                          : session.intentionType === 'SPECIFIC_TASK'
                          ? 'Task'
                          : 'Avoidance'}
                      </span>
                    </td>
                    <td>{formatSeconds(session.plannedDurationSeconds)}</td>
                    <td>
                      <strong>{formatSeconds(session.actualActiveSeconds)}</strong>
                    </td>
                    <td>
                      {overrun > 0 ? (
                        <span style={{ color: '#f87171', fontWeight: 600 }}>
                          +{formatSeconds(overrun)}
                        </span>
                      ) : (
                        <span style={{ color: '#34d399', fontWeight: 600 }}>Kept Limit</span>
                      )}
                    </td>
                    <td>
                      {session.bypassCount === 0 ? (
                        <span className="badge badge-emerald">0</span>
                      ) : (
                        <span className="badge badge-rose">{session.bypassCount}</span>
                      )}
                    </td>
                    <td>
                      {reflection ? (
                        <div>
                          <span
                            className={`badge ${
                              reflection.worthIt === 'YES'
                                ? 'badge-emerald'
                                : reflection.worthIt === 'NEUTRAL'
                                ? 'badge-amber'
                                : 'badge-rose'
                            }`}
                          >
                            {reflection.worthIt === 'YES'
                              ? '👍 Worth it'
                              : reflection.worthIt === 'NEUTRAL'
                              ? '😐 Neutral'
                              : '👎 Regret'}
                          </span>
                          {reflection.feelingText && (
                            <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '4px', fontStyle: 'italic' }}>
                              "{reflection.feelingText}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '12px' }}>None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
