import React from "react";
import { useNavigate } from "react-router-dom";
import "./PopUp.css";

// Pass message, function to close the popup, whether to show the login button, and a popupType prop
const Popup = ({ message, closePopup, showLoginButton, popupType }) => {
  const navigate = useNavigate();

  // Route user to login page when "Go to login page" button is clicked
  const handleLogin = () => {
    navigate("/login");
    closePopup();
  };

  // Determine the class names based on popupType or showLoginButton
  const overlayClass =
    popupType === "product-details"
      ? "product-details-overlay"
      : showLoginButton
      ? "login-overlay"
      : "success-overlay";

  const popupClass =
    popupType === "product-details"
      ? "product-details-popup"
      : showLoginButton
      ? "login-popup"
      : "success-popup";

  return (
    <>
      <div className={overlayClass}>
        <div className={popupClass}>
          <p>{message}</p>
          {showLoginButton ? (
            <>
              <button onClick={closePopup}>Cancel</button>
              <button onClick={handleLogin}>Go to Login Page</button>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Popup;
