import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginContext } from '../contexts/LoginContext';
import { GoogleLogin, useGoogleLogin} from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode'

import Popup from '../components/PopUp';

const BACKEND_API_URL = "http://127.0.0.1:5000/api";

const LoginPage = () => {
  const { setIsLoggedIn, setUser } = useContext(LoginContext);
  const navigate = useNavigate();

  const [showPopup, setShowPopup] = useState(false);
 
  //this function is to add the google auth for the stylized login button that faith made
  //
  const login = useGoogleLogin({
    onSuccess: async (response) => {
      const token = response.credential; // Get the ID token
      try {
          const backendResponse = await fetch(`${BACKEND_API_URL}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token })  // Send token to backend
          });

          const data = await backendResponse.json();
          console.log("Backend response:", data);
          
          //If the backend response is successful, set the user and login state in context and show the popup message
          if (backendResponse.ok) {
            setUser(data); // Store user data in context
            setIsLoggedIn(true); // Set login state to true  
            handleLogin()
          } else {
            console.error("Login failed:", data.message);
          }
      } catch (error) {
          console.error("Error logging in:", error);
      }
  },
  onError: () => console.log("Login Failed")
  });

  //When signing in with google console log the user credential and send it to backend 
  const handleSuccess = async (credentialResponse) => {
    console.log(jwtDecode(credentialResponse.credential))
    const token = credentialResponse.credential;
    console.log(token)
    //Send to backend on success
    try {
          const backendResponse = await fetch(`${BACKEND_API_URL}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token })  // Send the userdata to backend
          });

          const data = await backendResponse.json();
          console.log("Backend response:", data);

          //If the backend response is successful, set the user and login state in context and show the popup message
          if (backendResponse.ok) {
            setUser(data); // Store user data in context
            setIsLoggedIn(true); // Set login state to true  
            handleLogin()
          } else {
            console.error("Login failed:", data.message);
          }
      } catch (error) {
          console.error("Error logging in:", error);
      }
    //Then show the popup and navigate to home after delay
    handleLogin()
  };

  
  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowPopup(true);
    //delay reroute for 5 seconds
    setTimeout(() => {
      navigate('/');
    }, 5000);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div>
      <h1>Login Page</h1>
      <GoogleLogin onSuccess={(credentialResponse) => {handleSuccess(credentialResponse)}} />
      <button onClick={() => login()}>Login</button>
      {showPopup && <Popup message="You have successfully logged in!" closePopup={closePopup}/>}
    </div>
  );
};

export default LoginPage;