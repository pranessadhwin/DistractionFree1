import React, { useState } from 'react';
import { StorageData } from '../../types/models';

interface PrivacyTabProps {
  data: StorageData;
  onRefreshData: () => void;
}

export const PrivacyTab: React.FC<PrivacyTabProps> = ({ data, onRefreshData }) => {
  const [importJson, setImportJson] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleExport = () => {
    chrome.runtime.sendMessage({ type: 'EXPORT_DATA' }, (res) => {
      if (res && res.success && res.data) {
        const blob = new Blob([res.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `past-self-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setStatusMsg('Data exported successfully!');
      }
    });
  };

  const handleImport = () => {
    if (!importJson.trim()) return;
    chrome.runtime.sendMessage({ type: 'IMPORT_DATA', jsonData: importJson }, (res) => {
      if (res && res.success) {
        setStatusMsg('Data imported successfully!');
        setImportJson('');
        onRefreshData();
      } else {
        setStatusMsg('Failed to import data: invalid JSON structure.');
      }
    });
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to delete all recorded sessions, reflections, and messages?')) {
      chrome.runtime.sendMessage({ type: 'RESET_DATA' }, () => {
        setStatusMsg('All data has been reset to defaults.');
        onRefreshData();
      });
    }
  };

  return (
    <div>
      <div className="dash-page-header">
        <h1 className="dash-page-title">Privacy, Export & Local Outbox</h1>
        <p className="dash-page-subtitle">
          Transparent data handling, local-first storage, and full export/deletion controls.
        </p>
      </div>

      {statusMsg && (
        <div
          className="dash-card"
          style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', marginBottom: '20px', padding: '12px 18px' }}
        >
          <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{statusMsg}</span>
        </div>
      )}

      {/* Privacy Guarantees */}
      <div className="dash-grid-2">
        <div className="dash-card">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
            🛡️ Privacy & Data Minimization
          </h2>
          <ul style={{ color: '#cbd5e1', fontSize: '13.5px', lineHeight: 1.6, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong>Domain-level only:</strong> Stores <code>youtube.com</code>, never video titles, search queries, or specific URLs.
            </li>
            <li>
              <strong>No content interception:</strong> Does not read page content, forms, keystrokes, or screenshots.
            </li>
            <li>
              <strong>Local-First:</strong> All active sessions, timing reconciliation, and intervention logic run locally inside your browser.
            </li>
            <li>
              <strong>No Cloud Dependency:</strong> Operates fully offline without external servers.
            </li>
          </ul>
        </div>

        <div className="dash-card">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
            📦 Outbox & Storage Status
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Recorded Events:</span>
              <strong>{data.events.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Recorded Interventions:</span>
              <strong>{data.interventions.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Reflections Captured:</span>
              <strong>{data.reflections.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Outbox Queue Count:</span>
              <span className="badge badge-emerald">{data.outbox.length} pending items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export & Import Controls */}
      <div className="dash-grid-2" style={{ marginTop: '20px' }}>
        <div className="dash-card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            Export Your Data
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
            Download a portable, structured JSON backup of all your goals, monitored sites, past-self messages, and session history.
          </p>
          <button className="btn btn-primary" onClick={handleExport}>
            ⬇ Download JSON Export
          </button>
        </div>

        <div className="dash-card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            Import Backup
          </h2>
          <textarea
            className="textarea-field"
            rows={3}
            placeholder="Paste exported JSON here..."
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            style={{ marginBottom: '12px', fontSize: '12px' }}
          />
          <button className="btn btn-secondary" onClick={handleImport}>
            ⬆ Restore Backup
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="dash-card" style={{ marginTop: '28px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
          Danger Zone: Reset All Data
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>
          Permanently deletes all recorded sessions, events, reflections, and custom messages, resetting the extension to default initial state.
        </p>
        <button className="btn btn-danger" onClick={handleReset}>
          Reset Everything
        </button>
      </div>
    </div>
  );
};
