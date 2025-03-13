import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import {GoogleOAuthProvider} from '@react-oauth/google'
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
const CLIENT_ID = '144290628858-fd2alsk6nteanv2i90c3o6u5g0rq714e.apps.googleusercontent.com'
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId = {CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);