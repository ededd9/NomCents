import React from "react";
import { useNavigate } from 'react-router-dom';

// Pass message, function to close the popup, and whether or not to show the login page reroute button as props
const Popup = ({ message, closePopup, showLoginButton }) => {

  const navigate = useNavigate();

  // Route user to login page when "Go to login page" button is clicked
  const handleLogin = () => {
    navigate('/login');
    closePopup();
  };

  return (
    <>
      <div className="popup-overlay">
        <div className="popup-box">
          <p>{message}</p>
          {showLoginButton ? (
            <>
              <button onClick={handleLogin}>Go to Login Page</button>
              <button onClick={closePopup}>Cancel</button>
            </>
          ) : (
            <button onClick={closePopup}>OK</button>
          )}
        </div>
      </div>
    </>
  );
};

export default Popup;
