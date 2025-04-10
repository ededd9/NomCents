import React, { useContext } from 'react'; // Import useContext
import { LoginContext } from '../contexts/LoginContext'; // Import LoginContext

const Homepage = () => {
  const { isLoggedIn, user } = useContext(LoginContext); // Get login status and user info

  // Function to get the time-based greeting
  const getGreeting = () => {
    const currentHour = new Date().getHours(); // Get the current hour (0-23)
    let greeting;

    if (currentHour >= 5 && currentHour < 12) {
      greeting = "Good morning";
    } else if (currentHour >= 12 && currentHour < 18) {
      greeting = "Good afternoon";
    } else {
      // Covers hours 18-23 and 0-4
      greeting = "Good evening";
    }
    return greeting;
  };

  const greetingMessage = getGreeting();
  // Customize the welcome message based on login status
  const userName = user?.username || user?.name; 

  return (
    <div className="homepage-container"> 

      {/* Dynamic Welcome Message */}
      <h1 className="welcome-message">
        {greetingMessage}
        {isLoggedIn && userName ? `, ${userName}` : ''}! {/* Add username if logged in */}
        {' Welcome to NomCents.'}
      </h1>

      <p>
        Your personal nutrition tracking and grocery planning application.
      </p>
      <p>
        Use the navigation bar above to search for products, view your favorites, manage your grocery cart, or check your profile.
      </p>

      

    </div>
  );
};

export default Homepage;