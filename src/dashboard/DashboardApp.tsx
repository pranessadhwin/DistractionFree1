import React, { useEffect, useState } from 'react';
import { StorageData, AnalyticsSummary, Goal, DistractingSite, PastSelfMessage } from '../types/models';
import { AnalyticsTab } from './components/AnalyticsTab';
import { PastSelfTab } from './components/PastSelfTab';
import { GoalsTab } from './components/GoalsTab';
import { SitesTab } from './components/SitesTab';
import { HistoryTab } from './components/HistoryTab';
import { PrivacyTab } from './components/PrivacyTab';
import { Onboarding } from './components/Onboarding';

type NavTab = 'analytics' | 'messages' | 'goals' | 'sites' | 'history' | 'privacy';

export const DashboardApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('analytics');
  const [data, setData] = useState<StorageData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  const loadData = () => {
    chrome.runtime.sendMessage({ type: 'GET_DASHBOARD_DATA' }, (res) => {
      if (res && res.success && res.data) {
        setData(res.data.data);
        setAnalytics(res.data.analytics);
        if (res.data.data.settings && !res.data.data.settings.onboardingCompleted) {
          setShowOnboarding(true);
        }
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateGoals = (goals: Goal[]) => {
    if (!data) return;
    setData({ ...data, goals });
    chrome.runtime.sendMessage({ type: 'UPDATE_GOALS', goals }, () => loadData());
  };

  const handleUpdateSites = (sites: DistractingSite[]) => {
    if (!data) return;
    setData({ ...data, sites });
    chrome.runtime.sendMessage({ type: 'UPDATE_SITES', sites }, () => loadData());
  };

  const handleUpdateMessages = (messages: PastSelfMessage[]) => {
    if (!data) return;
    setData({ ...data, pastSelfMessages: messages });
    chrome.runtime.sendMessage({ type: 'UPDATE_MESSAGES', messages }, () => loadData());
  };

  const handleCompleteOnboarding = (
    sites: DistractingSite[],
    goals: Goal[],
    message?: PastSelfMessage
  ) => {
    if (!data) return;
    const pastSelfMessages = message ? [message, ...data.pastSelfMessages] : data.pastSelfMessages;
    const settings = { ...data.settings, onboardingCompleted: true };

    chrome.runtime.sendMessage({ type: 'UPDATE_SITES', sites });
    chrome.runtime.sendMessage({ type: 'UPDATE_GOALS', goals });
    chrome.runtime.sendMessage({ type: 'UPDATE_MESSAGES', messages: pastSelfMessages });
    chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings }, () => {
      setShowOnboarding(false);
      loadData();
    });
  };

  if (showOnboarding) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  if (!data || !analytics) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Loading behavioral data...
      </div>
    );
  }

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <div className="dash-brand-icon">⏳</div>
          <div>
            <h2 className="dash-brand-title">Past-Self</h2>
            <p className="dash-brand-subtitle">Intention System</p>
          </div>
        </div>

        <nav className="dash-nav">
          <button
            className={`dash-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="dash-nav-icon">📊</span>
            Insights & Trends
          </button>
          <button
            className={`dash-nav-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <span className="dash-nav-icon">💌</span>
            Past-Self Messages
          </button>
          <button
            className={`dash-nav-btn ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            <span className="dash-nav-icon">🎯</span>
            Active Goals
          </button>
          <button
            className={`dash-nav-btn ${activeTab === 'sites' ? 'active' : ''}`}
            onClick={() => setActiveTab('sites')}
          >
            <span className="dash-nav-icon">🌐</span>
            Monitored Sites
          </button>
          <button
            className={`dash-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span className="dash-nav-icon">📜</span>
            Session History
          </button>
          <button
            className={`dash-nav-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <span className="dash-nav-icon">🛡️</span>
            Privacy & Outbox
          </button>
        </nav>

        <div style={{ padding: '12px 14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', fontSize: '12px', color: '#94a3b8' }}>
          <span>Active Monitored Sites: </span>
          <strong style={{ color: '#ffffff' }}>
            {data.sites.filter((s) => s.isEnabled).length}
          </strong>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        {activeTab === 'analytics' && <AnalyticsTab analytics={analytics} data={data} />}
        {activeTab === 'messages' && (
          <PastSelfTab
            messages={data.pastSelfMessages}
            goals={data.goals}
            sites={data.sites}
            onUpdateMessages={handleUpdateMessages}
          />
        )}
        {activeTab === 'goals' && (
          <GoalsTab goals={data.goals} onUpdateGoals={handleUpdateGoals} />
        )}
        {activeTab === 'sites' && (
          <SitesTab sites={data.sites} onUpdateSites={handleUpdateSites} />
        )}
        {activeTab === 'history' && (
          <HistoryTab sessions={data.sessions} reflections={data.reflections} />
        )}
        {activeTab === 'privacy' && <PrivacyTab data={data} onRefreshData={loadData} />}
      </main>
    </div>
  );
};
