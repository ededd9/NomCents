import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App";
import { LoginProvider } from "./contexts/LoginContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
const CLIENT_ID =
  "526186196572-chkjnqr64b9uouth4sddnbp0pc6vi43q.apps.googleusercontent.com";

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <LoginProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LoginProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
