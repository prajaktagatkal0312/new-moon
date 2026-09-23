import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}
import React from 'react';
import ReactDOM from 'react-dom/client';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import '@midnight-ntwrk/dapp-connector-api';
import App from './App';
import './index.css';

// Set global fallback for Midnight SDK
setNetworkId('preview');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
