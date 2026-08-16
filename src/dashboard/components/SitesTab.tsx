import React, { useState } from 'react';
import { DistractingSite } from '../../types/models';
import { generateId } from '../../utils/uuid';
import { getIsoUtcNow } from '../../utils/time';
import { extractDomain } from '../../utils/domain';

interface SitesTabProps {
  sites: DistractingSite[];
  onUpdateSites: (sites: DistractingSite[]) => void;
}

const POPULAR_PRESETS = [
  { domain: 'youtube.com', name: 'YouTube', category: 'video' as const },
  { domain: 'instagram.com', name: 'Instagram', category: 'social' as const },
  { domain: 'twitter.com', name: 'Twitter', category: 'social' as const },
  { domain: 'x.com', name: 'X', category: 'social' as const },
  { domain: 'reddit.com', name: 'Reddit', category: 'social' as const },
  { domain: 'tiktok.com', name: 'TikTok', category: 'video' as const },
  { domain: 'linkedin.com', name: 'LinkedIn', category: 'social' as const },
  { domain: 'twitch.tv', name: 'Twitch', category: 'video' as const },
  { domain: 'netflix.com', name: 'Netflix', category: 'video' as const }
];

export const SitesTab: React.FC<SitesTabProps> = ({ sites, onUpdateSites }) => {
  const [newDomain, setNewDomain] = useState('');
  const [newName, setNewName] = useState('');

  const handleToggle = (id: string) => {
    const updated = sites.map((s) => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
    onUpdateSites(updated);
  };

  const handleDelete = (id: string) => {
    const updated = sites.filter((s) => s.id !== id);
    onUpdateSites(updated);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    const normalized = extractDomain(newDomain.trim());
    if (sites.some((s) => s.domain === normalized)) {
      alert('This domain is already in your monitored list.');
      return;
    }

    const newSite: DistractingSite = {
      id: generateId('site'),
      domain: normalized,
      name: newName.trim() || normalized,
      isEnabled: true,
      createdAt: getIsoUtcNow()
    };

    onUpdateSites([...sites, newSite]);
    setNewDomain('');
    setNewName('');
  };

  const handleAddPreset = (preset: typeof POPULAR_PRESETS[0]) => {
    if (sites.some((s) => s.domain === preset.domain)) return;
    const newSite: DistractingSite = {
      id: generateId('site'),
      domain: preset.domain,
      name: preset.name,
      isEnabled: true,
      category: preset.category,
      createdAt: getIsoUtcNow()
    };
    onUpdateSites([...sites, newSite]);
  };

  return (
    <div>
      <div className="dash-page-header">
        <h1 className="dash-page-title">Monitored Distraction Domains</h1>
        <p className="dash-page-subtitle">
          Which sites tend to take more time than you intended? (Domain-level tracking only).
        </p>
      </div>

      {/* Add Domain Form */}
      <div className="dash-card" style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
          Add Custom Monitored Domain
        </h2>
        <form onSubmit={handleAddDomain} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input-field"
            style={{ flex: 2, minWidth: '200px' }}
            placeholder="e.g. news.ycombinator.com or facebook.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
          />
          <input
            type="text"
            className="input-field"
            style={{ flex: 1, minWidth: '150px' }}
            placeholder="Display Name (Optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            + Monitor Domain
          </button>
        </form>

        {/* Popular Presets */}
        <div style={{ marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '8px' }}>
            Quick Add:
          </span>
          <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
            {POPULAR_PRESETS.map((preset) => {
              const alreadyAdded = sites.some((s) => s.domain === preset.domain);
              return (
                <button
                  key={preset.domain}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: alreadyAdded ? 0.4 : 1, cursor: alreadyAdded ? 'default' : 'pointer' }}
                  onClick={() => !alreadyAdded && handleAddPreset(preset)}
                  disabled={alreadyAdded}
                >
                  {preset.name} {alreadyAdded ? '✓' : '+'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sites List Table */}
      <div className="dash-table-wrapper">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Display Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.id}>
                <td>
                  <strong>{site.domain}</strong>
                </td>
                <td>{site.name}</td>
                <td>
                  <span className={`badge ${site.isEnabled ? 'badge-emerald' : 'badge-amber'}`}>
                    {site.isEnabled ? 'Active Interception' : 'Paused'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleToggle(site.id)}
                    >
                      {site.isEnabled ? 'Pause' : 'Enable'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(site.id)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
