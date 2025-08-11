import React from 'react';
import ReactDOM from 'react-dom/client';
import RoutesConfig from './routes';
import './index.css';

// Debug hooks (remove later)
window.addEventListener("error", (e) => {
  console.error("[window.error]", e.message, e.error?.stack);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[unhandledrejection]", e.reason);
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RoutesConfig />
  </React.StrictMode>,
);
