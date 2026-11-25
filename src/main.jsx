import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/v2-core.css';
import './styles/hdr-and-upgrades.css';
import './styles/subpages.css';
import './styles/admin.css';
import { App } from './App';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
