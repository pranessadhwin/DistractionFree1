import React from 'react';
import ReactDOM from 'react-dom/client';
import { ShadowHostApp } from './ShadowHost';
import contentStyles from './styles/content.css?inline';

const LOG_PREFIX = '[Past-Self Content]';

function injectOverlay() {
  console.log(LOG_PREFIX, '🔧 injectOverlay() called. Document readyState:', document.readyState);

  // Prevent duplicate injections
  const existingContainer = document.getElementById('past-self-overlay-root');
  if (existingContainer) {
    console.log(LOG_PREFIX, 'Already injected, skipping.');
    return;
  }

  const container = document.createElement('div');
  container.id = 'past-self-overlay-root';
  container.style.position = 'fixed';
  container.style.zIndex = '2147483647';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '0';
  container.style.height = '0';
  container.style.pointerEvents = 'none';

  // Attach shadow root to prevent page CSS bleeding
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Inject styles
  const styleTag = document.createElement('style');
  styleTag.textContent = contentStyles;
  shadowRoot.appendChild(styleTag);

  // Mount point
  const mountPoint = document.createElement('div');
  mountPoint.id = 'past-self-mount';
  shadowRoot.appendChild(mountPoint);

  const targetParent = document.body || document.documentElement;
  if (targetParent) {
    targetParent.appendChild(container);
    console.log(LOG_PREFIX, '✅ Container injected into DOM. Mounting React...');
    const root = ReactDOM.createRoot(mountPoint);
    root.render(
      <React.StrictMode>
        <ShadowHostApp />
      </React.StrictMode>
    );
    console.log(LOG_PREFIX, '✅ React mounted successfully.');
  } else {
    console.error(LOG_PREFIX, '❌ No target parent element found (body/documentElement)!');
  }
}

// Boot sequence
console.log(LOG_PREFIX, '📦 Content script loaded. URL:', window.location.href, 'readyState:', document.readyState);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log(LOG_PREFIX, 'DOMContentLoaded event fired');
    injectOverlay();
  });
} else {
  // DOM is already ready (interactive or complete)
  injectOverlay();
}
