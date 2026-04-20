import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import App from './App.jsx';
import { store } from './store/store.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#171b26',
              color:      '#e2e8f0',
              border:     '1px solid #1e2333',
              borderRadius: '12px',
              fontSize:   '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
