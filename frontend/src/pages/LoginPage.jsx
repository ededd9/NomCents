import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginContext } from '../contexts/LoginContext';
import Popup from '../components/PopUp';

const LoginPage = () => {
  const { setIsLoggedIn } = useContext(LoginContext);
  const navigate = useNavigate();

  const [showPopup, setShowPopup] = useState(false);

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
      <button onClick={handleLogin}>Login</button>
      {showPopup && <Popup message="You have successfully logged in!" closePopup={closePopup}/>}
    </div>
  );
};

export default LoginPage;