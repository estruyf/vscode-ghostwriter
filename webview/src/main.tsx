import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />

    <img style={{
      display: 'none'
    }} src={`https://api.visitorbadge.io/api/combined?path=https:%2f%2fgithub.com%2festruyf%2fvscode-ghostwriter&labelColor=%23202736&countColor=%23FFD23F&slug=webview`} alt={`Ghostwriter usage`} />
  </React.StrictMode>
);
