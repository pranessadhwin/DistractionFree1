import React, { useState } from 'react';
import { Goal } from '../../types/models';
import { generateId } from '../../utils/uuid';
import { getIsoUtcNow } from '../../utils/time';

interface GoalsTabProps {
  goals: Goal[];
  onUpdateGoals: (goals: Goal[]) => void;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({ goals, onUpdateGoals }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleToggleActive = (id: string) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, isActive: !g.isActive } : g));
    onUpdateGoals(updated);
  };

  const handleDelete = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    onUpdateGoals(updated);
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    if (goals.length >= 3) {
      alert('The system encourages focusing on at most 3 active high-leverage goals.');
    }

    const newGoal: Goal = {
      id: generateId('goal'),
      title: title.trim(),
      description: description.trim() || undefined,
      isActive: true,
      color: '#6366f1',
      createdAt: getIsoUtcNow()
    };

    onUpdateGoals([...goals, newGoal]);
    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="dash-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="dash-page-title">Active Goals & Return Tasks</h1>
          <p className="dash-page-subtitle">
            Keep 1 to 3 meaningful current goals to anchor your implementation intentions.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
          disabled={goals.length >= 3}
          style={{ opacity: goals.length >= 3 ? 0.6 : 1 }}
        >
          + Add Goal {goals.length >= 3 ? '(Max 3)' : ''}
        </button>
      </div>

      <div className="dash-grid-3">
        {goals.map((goal) => (
          <div key={goal.id} className="dash-card">
            <div className="dash-card-header">
              <span className={`badge ${goal.isActive ? 'badge-emerald' : 'badge-amber'}`}>
                {goal.isActive ? 'Active Priority' : 'Paused'}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleToggleActive(goal.id)}
                >
                  {goal.isActive ? 'Pause' : 'Activate'}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(goal.id)}
                >
                  ✕
                </button>
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              {goal.title}
            </h3>

            {goal.description && (
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', lineHeight: 1.4 }}>
                {goal.description}
              </p>
            )}

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', marginTop: '12px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                Sample Return Action
              </span>
              <p style={{ fontSize: '12.5px', color: '#cbd5e1', marginTop: '4px' }}>
                "Spend 25m on {goal.title.toLowerCase()}"
              </p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
              Add Active Goal
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
              What project or outcome matters most to you right now?
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Goal Title
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Master Algorithms Course, Ship Portfolio 2.0"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Why does this matter? (Brief description)
              </label>
              <textarea
                className="textarea-field"
                rows={3}
                placeholder="e.g. Prepare for upcoming technical interviews with clarity and confidence"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreate}>
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
