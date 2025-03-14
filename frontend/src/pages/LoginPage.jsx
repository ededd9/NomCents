import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginContext } from '../contexts/LoginContext';
import { GoogleLogin, useGoogleLogin} from '@react-oauth/google';
import {jwtDecode} from 'jwt-decode'

import Popup from '../components/PopUp';

const LoginPage = () => {
  const { setIsLoggedIn } = useContext(LoginContext);
  const navigate = useNavigate();

  const [showPopup, setShowPopup] = useState(false);
 
  //this function is to add the google auth for the stylized login button that faith made
  //
  const login = useGoogleLogin({
    onSuccess: async (response) => {
      const token = response.credential; // Get the ID token
      try {
          const backendResponse = await fetch("http://localhost:5173/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token })  // Send token to backend
          });

          const data = await backendResponse.json();
          console.log("Backend response:", data);
          handleLogin()
      } catch (error) {
          console.error("Error logging in:", error);
      }
  },
  onError: () => console.log("Login Failed")
  });

  //When signing in with google console log the user credential and send it to backend 
  const handleSuccess = async (credentialResponse) => {
    console.log(jwtDecode(credentialResponse.credential))
    const {sub, given_name, name, email}= jwtDecode(credentialResponse.credential)
    const token = {
      _id:sub,
      _given_name: given_name,
      _name:name,
      _email:email,
    };
    console.log(token)
    //Still need to send to backend on success
    try {
          const backendResponse = await fetch("http://localhost:5173/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: token // Send the userdata to backend
          });

          const data = await backendResponse.json();
          console.log("Backend response:", data);
          handleLogin()
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