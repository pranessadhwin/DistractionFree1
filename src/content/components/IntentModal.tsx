import React, { useState } from 'react';
import { Goal } from '../../types/models';

interface IntentModalProps {
  domain: string;
  goals: Goal[];
  onStartShortBreak: (durationSec: number, returnTask: string, goalId?: string) => void;
  onAutomaticClose: () => void;
  onAutomaticConvert5m: () => void;
  onStartSpecificTask: (durationSec: number, purpose: string) => void;
  onStartAvoidance: (microStep: string) => void;
}

export const IntentModal: React.FC<IntentModalProps> = ({
  domain,
  goals,
  onStartShortBreak,
  onAutomaticClose,
  onAutomaticConvert5m,
  onStartSpecificTask,
  onStartAvoidance
}) => {
  const [activeTab, setActiveTab] = useState<'break' | 'auto' | 'task' | 'avoid'>('break');

  // Short Break state
  const [breakDuration, setBreakDuration] = useState<number>(300); // 5 min default
  const [returnTask, setReturnTask] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');

  // Specific Task state
  const [taskDuration, setTaskDuration] = useState<number>(180); // 3 min default
  const [taskPurpose, setTaskPurpose] = useState<string>('');

  // Avoidance state
  const [microStep, setMicroStep] = useState<string>('');

  return (
    <div className="ps-overlay-backdrop">
      <div className="ps-card">
        <div className="ps-header">
          <span className="ps-badge ps-badge-primary">Decision Point</span>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>{domain}</span>
        </div>

        <h1 className="ps-title">What do you need right now?</h1>
        <p className="ps-subtitle">
          Pause for a second. Clarify your intention before entering this site.
        </p>

        {/* Intention Tabs */}
        <div className="ps-tabs">
          <button
            className={`ps-tab-btn ${activeTab === 'break' ? 'active' : ''}`}
            onClick={() => setActiveTab('break')}
          >
            ☕ Break
          </button>
          <button
            className={`ps-tab-btn ${activeTab === 'auto' ? 'active' : ''}`}
            onClick={() => setActiveTab('auto')}
          >
            ⚡ Habit
          </button>
          <button
            className={`ps-tab-btn ${activeTab === 'task' ? 'active' : ''}`}
            onClick={() => setActiveTab('task')}
          >
            🎯 Task
          </button>
          <button
            className={`ps-tab-btn ${activeTab === 'avoid' ? 'active' : ''}`}
            onClick={() => setActiveTab('avoid')}
          >
            🛡️ Avoid
          </button>
        </div>

        {/* TAB 1: Short Break */}
        {activeTab === 'break' && (
          <div>
            <div className="ps-field-group">
              <label className="ps-label">Break Duration</label>
              <div className="ps-duration-selector">
                <button
                  type="button"
                  className={`ps-duration-chip ${breakDuration === 300 ? 'active' : ''}`}
                  onClick={() => setBreakDuration(300)}
                >
                  5 Minutes
                </button>
                <button
                  type="button"
                  className={`ps-duration-chip ${breakDuration === 600 ? 'active' : ''}`}
                  onClick={() => setBreakDuration(600)}
                >
                  10 Minutes
                </button>
                <button
                  type="button"
                  className={`ps-duration-chip ${breakDuration === 900 ? 'active' : ''}`}
                  onClick={() => setBreakDuration(900)}
                >
                  15 Minutes
                </button>
              </div>
            </div>

            <div className="ps-field-group">
              <label className="ps-label">Concrete Return Task (What will you do next?)</label>
              <input
                type="text"
                className="ps-input"
                placeholder="e.g., Finish algorithm problem #3, reply to email..."
                value={returnTask}
                onChange={(e) => setReturnTask(e.target.value)}
                autoFocus
              />
            </div>

            {goals.length > 0 && (
              <div className="ps-field-group">
                <label className="ps-label">Connected Priority Goal (Optional)</label>
                <select
                  className="ps-select"
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="ps-button-group">
              <button
                className="ps-btn ps-btn-primary"
                onClick={() => {
                  const task = returnTask.trim() || 'Return to work & priorities';
                  onStartShortBreak(breakDuration, task, selectedGoalId);
                }}
              >
                ✓ Start {Math.round(breakDuration / 60)}m Break & Commit
              </button>
              <button className="ps-btn ps-btn-ghost" onClick={onAutomaticClose}>
                Nevermind, close this tab
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Automatic Open (Learned Habit) */}
        {activeTab === 'auto' && (
          <div>
            <div className="ps-callout ps-callout-warning">
              <p style={{ fontSize: '14px', color: '#fef3c7' }}>
                You opened this out of muscle memory or automatic reflex.
              </p>
            </div>
            <div className="ps-button-group">
              <button className="ps-btn ps-btn-emerald" onClick={onAutomaticClose} autoFocus>
                ✕ Close Tab & Return (Zero friction)
              </button>
              <button className="ps-btn ps-btn-secondary" onClick={onAutomaticConvert5m}>
                Convert to conscious 5-minute break
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Specific Task */}
        {activeTab === 'task' && (
          <div>
            <div className="ps-field-group">
              <label className="ps-label">What specific purpose brings you here?</label>
              <input
                type="text"
                className="ps-input"
                placeholder="e.g. Look up video tutorial for Prim's algorithm..."
                value={taskPurpose}
                onChange={(e) => setTaskPurpose(e.target.value)}
                autoFocus
              />
            </div>
            <div className="ps-field-group">
              <label className="ps-label">Quick Purpose Limit</label>
              <div className="ps-duration-selector">
                <button
                  type="button"
                  className={`ps-duration-chip ${taskDuration === 120 ? 'active' : ''}`}
                  onClick={() => setTaskDuration(120)}
                >
                  2 min
                </button>
                <button
                  type="button"
                  className={`ps-duration-chip ${taskDuration === 300 ? 'active' : ''}`}
                  onClick={() => setTaskDuration(300)}
                >
                  5 min
                </button>
              </div>
            </div>
            <div className="ps-button-group">
              <button
                className="ps-btn ps-btn-primary"
                onClick={() => {
                  const purpose = taskPurpose.trim() || 'Specific task query';
                  onStartSpecificTask(taskDuration, purpose);
                }}
              >
                Set {Math.round(taskDuration / 60)}m Purpose Timer
              </button>
              <button className="ps-btn ps-btn-ghost" onClick={onAutomaticClose}>
                Close Tab
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Avoidance */}
        {activeTab === 'avoid' && (
          <div>
            <div className="ps-callout">
              <p style={{ fontSize: '13.5px', color: '#e2e8f0' }}>
                Avoidance happens when a task feels too big or ambiguous. Shrink it down to the smallest 2-minute step.
              </p>
            </div>
            <div className="ps-field-group">
              <label className="ps-label">Smallest 2-minute step</label>
              <input
                type="text"
                className="ps-input"
                placeholder="e.g. Just open notes and write the first bullet point..."
                value={microStep}
                onChange={(e) => setMicroStep(e.target.value)}
                autoFocus
              />
            </div>
            <div className="ps-button-group">
              <button
                className="ps-btn ps-btn-emerald"
                onClick={() => {
                  const step = microStep.trim() || 'Do 2 minutes of focused re-entry';
                  onStartAvoidance(step);
                }}
              >
                🚀 Start 2-Minute Micro Step
              </button>
              <button className="ps-btn ps-btn-ghost" onClick={onAutomaticClose}>
                Close Tab
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
