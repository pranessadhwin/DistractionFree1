import React, { useState } from 'react';
import { DistractingSite, Goal, PastSelfMessage } from '../../types/models';
import { generateId } from '../../utils/uuid';
import { getIsoUtcNow } from '../../utils/time';

interface OnboardingProps {
  onComplete: (sites: DistractingSite[], goals: Goal[], message?: PastSelfMessage) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  // Selected sites
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    'youtube.com',
    'instagram.com',
    'reddit.com',
    'twitter.com'
  ]);

  // Goal
  const [goalTitle, setGoalTitle] = useState('Deep Work & Exam Preparation');

  // Past Self Message
  const [pastSelfMsg, setPastSelfMsg] = useState(
    'Remember: 5 minutes of mindful rest refreshes you, but 45 minutes of mindless feed scrolling leaves you rushed, guilty, and exhausted. Finish your study first!'
  );

  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== domain));
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  const handleFinish = () => {
    const sites: DistractingSite[] = selectedDomains.map((domain) => ({
      id: generateId('site'),
      domain,
      name: domain.split('.')[0].toUpperCase(),
      isEnabled: true,
      createdAt: getIsoUtcNow()
    }));

    const goals: Goal[] = [
      {
        id: generateId('goal'),
        title: goalTitle.trim() || 'Focused Work',
        isActive: true,
        createdAt: getIsoUtcNow()
      }
    ];

    const message: PastSelfMessage = {
      id: generateId('msg'),
      message: pastSelfMsg.trim(),
      relatedGoalId: goals[0].id,
      isActive: true,
      timesShown: 0,
      timesExited: 0,
      createdAt: getIsoUtcNow()
    };

    onComplete(sites, goals, message);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0f1d',
        padding: '24px'
      }}
    >
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '9999px',
                background: i <= step ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'
              }}
            />
          ))}
        </div>

        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Welcome to Past-Self
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
              Most website blockers treat you like an adversary with coercive blocks. Past-Self is an{' '}
              <strong>intention-preservation system</strong>. It honors your choice to take genuine breaks, but
              helps you stop when you intended to stop by connecting your past clarity with present temptation.
            </p>
            <div className="dash-card" style={{ marginBottom: '24px', background: 'rgba(99, 102, 241, 0.1)' }}>
              <p style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                💡 <strong>Core Principle:</strong> The enemy is not recreation. The enemy is intended time becoming unintended time without a conscious decision.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Continue to Site Selection →
            </button>
          </div>
        )}

        {/* STEP 2: Monitored Domains */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Which sites take more time than you intend?
            </h2>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '18px' }}>
              Select the sites where you'd like an intentional pause before browsing:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              {[
                'youtube.com',
                'instagram.com',
                'reddit.com',
                'twitter.com',
                'x.com',
                'tiktok.com',
                'linkedin.com',
                'netflix.com'
              ].map((domain) => {
                const isSelected = selectedDomains.includes(domain);
                return (
                  <div
                    key={domain}
                    onClick={() => toggleDomain(domain)}
                    style={{
                      padding: '12px 14px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13.5px'
                    }}
                  >
                    <span>{domain}</span>
                    <span>{isSelected ? '✓' : '+'}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                Next: Priority Goal →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Goal */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              What is your primary focus right now?
            </h2>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '18px' }}>
              Having an explicit active goal makes return tasks much more concrete.
            </p>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Active Goal Title
              </label>
              <input
                type="text"
                className="input-field"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Master Algorithms Course, Ship Portfolio 2.0"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>
                Next: Past-Self Message →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: First Past-Self Message */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Author your first Past-Self message
            </h2>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '18px' }}>
              When you're about to lose focus, the system will resurface this exact note to your future self:
            </p>
            <div style={{ marginBottom: '24px' }}>
              <textarea
                className="textarea-field"
                rows={4}
                value={pastSelfMsg}
                onChange={(e) => setPastSelfMsg(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => setStep(3)}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={handleFinish}>
                ✓ Complete Setup & Open Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
