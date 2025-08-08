import React from 'react';
import ReactDOM from 'react-dom/client';
import RoutesConfig from './routes';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RoutesConfig />
  </React.StrictMode>,
);
