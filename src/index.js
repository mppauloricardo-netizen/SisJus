import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Este arquivo renderiza o componente principal (App) dentro do HTML
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
