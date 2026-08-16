import React, { useState } from 'react';
import { PastSelfMessage, Goal, DistractingSite } from '../../types/models';
import { generateId } from '../../utils/uuid';
import { getIsoUtcNow, formatRelativeDate } from '../../utils/time';

interface PastSelfTabProps {
  messages: PastSelfMessage[];
  goals: Goal[];
  sites: DistractingSite[];
  onUpdateMessages: (messages: PastSelfMessage[]) => void;
}

export const PastSelfTab: React.FC<PastSelfTabProps> = ({
  messages,
  goals,
  sites,
  onUpdateMessages
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');

  const handleToggleActive = (id: string) => {
    const updated = messages.map((m) =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    onUpdateMessages(updated);
  };

  const handleDelete = (id: string) => {
    const updated = messages.filter((m) => m.id !== id);
    onUpdateMessages(updated);
  };

  const handleCreateMessage = () => {
    if (!newText.trim()) return;

    const newMsg: PastSelfMessage = {
      id: generateId('msg'),
      message: newText.trim(),
      relatedGoalId: selectedGoalId || undefined,
      relatedSiteId: selectedSiteId || undefined,
      isActive: true,
      timesShown: 0,
      timesExited: 0,
      createdAt: getIsoUtcNow()
    };

    onUpdateMessages([newMsg, ...messages]);
    setNewText('');
    setSelectedGoalId('');
    setSelectedSiteId('');
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="dash-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="dash-page-title">Past-Self Messages Vault</h1>
          <p className="dash-page-subtitle">
            Messages written by your clear-minded self to intervene during moments of future temptation.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Write New Message
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 ? (
          <div className="dash-card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
              You have not created any past-self messages yet.
            </p>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              Author Your First Message
            </button>
          </div>
        ) : (
          messages.map((msg) => {
            const exitRate =
              msg.timesShown > 0 ? Math.round((msg.timesExited / msg.timesShown) * 100) : null;
            const goal = goals.find((g) => g.id === msg.relatedGoalId);
            const site = sites.find((s) => s.id === msg.relatedSiteId);

            return (
              <div
                key={msg.id}
                className="dash-card"
                style={{
                  borderLeft: msg.isActive ? '4px solid #6366f1' : '4px solid #475569',
                  opacity: msg.isActive ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`badge ${msg.isActive ? 'badge-indigo' : 'badge-amber'}`}>
                      {msg.isActive ? 'Active in Rotation' : 'Disabled'}
                    </span>
                    {goal && <span className="badge badge-emerald">Goal: {goal.title}</span>}
                    {site && <span className="badge badge-amber">{site.name}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleToggleActive(msg.id)}
                    >
                      {msg.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(msg.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '16px', color: '#ffffff', fontStyle: 'italic', marginBottom: '12px', lineHeight: 1.5 }}>
                  "{msg.message}"
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
                  <span>Created {formatRelativeDate(msg.createdAt)}</span>
                  <div>
                    Shown <strong>{msg.timesShown}</strong> times • Stopped distraction{' '}
                    <strong style={{ color: '#34d399' }}>{msg.timesExited}</strong> times{' '}
                    {exitRate !== null && `(${exitRate}% exit rate)`}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Authoring Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
              Author a Past-Self Message
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
              Speak directly and honestly to yourself. What does present-you wish future-you would remember when you're about to lose an hour?
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Your Message
              </label>
              <textarea
                className="textarea-field"
                rows={4}
                placeholder="e.g. You thought you were just taking 5 minutes, but you know you have an exam tomorrow. The relief of finishing your study is 10x better than this feed."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Linked Goal (Optional)
                </label>
                <select
                  className="select-field"
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                >
                  <option value="">Any Goal</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Linked Site (Optional)
                </label>
                <select
                  className="select-field"
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                >
                  <option value="">Any Monitored Site</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateMessage}>
                Save Past-Self Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
