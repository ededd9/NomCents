import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../contexts/LoginContext";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

import Popup from "../components/PopUp";

import "./LoginPage.css";

const BACKEND_API_URL =
  import.meta.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api";

const LoginPage = () => {
  const { setIsLoggedIn, setUser } = useContext(LoginContext);
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // Email/PW login & registration
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      //send req to auth endpoint
      const response = await fetch(`${BACKEND_API_URL}/auth/email`, {
        method: "POST",
        headers: {
          //JSON content needed
          "Content-Type": "application/json",
        },
        //split up json, get email,pw, and name
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          ...(isRegistering ? { name: loginData.name } : {}), // Only include name if registering
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Authentication failed");
      }

      const data = await response.json();

      // Handle successful registration
      if (isRegistering) {
        alert("Registration successful! Please log in.");
        setIsRegistering(false);
        // Clear form
        setLoginData({
          email: "",
          password: "",
          name: "",
        });
      } else {
        // Handle successful login
        setUser(data);
        setIsLoggedIn(true);
        handleLogin();
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Authentication failed");
    }
  };
  //this function is to add the google auth for the stylized login button that faith made
  //
  const login = useGoogleLogin({
    onSuccess: async (response) => {
      const token = response.credential; // Get the ID token
      try {
        const backendResponse = await fetch(`${BACKEND_API_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }), // Send token to backend
        });

        const data = await backendResponse.json();
        console.log("Backend response:", data);

        //If the backend response is successful, set the user and login state in context and show the popup message
        if (backendResponse.ok) {
          setUser(data); // Store user data in context
          setIsLoggedIn(true); // Set login state to true
          handleLogin();
        } else {
          console.error("Login failed:", data.message);
        }
      } catch (error) {
        console.error("Error logging in:", error);
      }
    },
    onError: () => console.log("Login Failed"),
  });

  //When signing in with google console log the user credential and send it to backend
  const handleSuccess = async (credentialResponse) => {
    console.log(jwtDecode(credentialResponse.credential));
    const token = credentialResponse.credential;
    console.log(token);
    //Send to backend on success
    try {
      const backendResponse = await fetch(`${BACKEND_API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }), // Send the userdata to backend
      });

      const data = await backendResponse.json();
      console.log("Backend response:", data);

      //If the backend response is successful, set the user and login state in context and show the popup message
      if (backendResponse.ok) {
        setUser(data); // Store user data in context
        setIsLoggedIn(true); // Set login state to true
        handleLogin();
      } else {
        console.error("Login failed:", data.message);
      }
    } catch (error) {
      console.error("Error logging in:", error);
    }
    //Then show the popup and navigate to home after delay
    handleLogin();
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowPopup(true);
    //delay reroute for 5 seconds
    setTimeout(() => {
      navigate("/");
    }, 5000);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="login-page-container">
      <div className="login-page">
        <h1 className="login-pg-title">
          {isRegistering ? "Register" : "Login"}
        </h1>

        <form className="login-form" onSubmit={handleEmailAuth}>
          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Name:</label>
              <input
                className="form-input"
                type="text"
                name="name"
                value={loginData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email:</label>
            <input
              className="form-input"
              type="email"
              name="email"
              value={loginData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password:</label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={loginData.password}
              onChange={handleChange}
              required
              minLength="8"
            />
          </div>

          <button className="form-submit-btn" type="submit">
            {isRegistering ? "Register" : "Login"}
          </button>
        </form>

        <button
          className="toggle-btn"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? "Login" : "Register"}
        </button>

        <div className="or-divider">Or</div>

        <div className="google-login-container">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              handleSuccess(credentialResponse);
            }}
          />
        </div>

        {showPopup && (
          <Popup
            message="You have successfully logged in!"
            closePopup={closePopup}
          />
        )}
      </div>
    </div>
  );
};

export default LoginPage;
