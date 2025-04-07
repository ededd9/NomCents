import { useState, useEffect, useContext } from "react";
import FavoritesList from "../components/FavoritesList";
import { LoginContext } from "../contexts/LoginContext";
// import "./FavoritesPage.css"; // Optional: Create and import CSS

const BACKEND_API_URL = "http://127.0.0.1:5000/api";

const FavoritesPage = () => {
  const [favoritesList, setFavoritesList] = useState([]);
  const { isLoggedIn, user } = useContext(LoginContext);
  const [isLoading, setIsLoading] = useState(false); // Optional loading state

  // Fetch favorites list when user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchFavoritesList(user.email);
    } else {
      // Clear list if user logs out
      setFavoritesList([]);
    }
  }, [isLoggedIn, user]);

  // Function to fetch favorites list from backend
  const fetchFavoritesList = async (email) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/user?email=${email}`);
      if (response.ok) {
        const userData = await response.json();
        console.log("User data for favorites:", userData);
        setFavoritesList(userData.favorites || []); // backend returns favorites list
      } else {
         console.error("Failed to fetch favorites list:", response.statusText);
         setFavoritesList([]); // Clear list on error
      }
    } catch (error) {
      console.error("Error fetching favorites list:", error);
      setFavoritesList([]); // Clear list on error
    } finally {
        setIsLoading(false);
    }
  };

  // Function to update favorites list in backend
  const updateFavoritesListBackend = async (newFavoritesList) => {
    if (!isLoggedIn || !user) return; // Should not happen if called correctly, but good practice

    try {
      console.log("Updating favorites list for email:", user.email);
      console.log("New favorites list:", newFavoritesList);

      const response = await fetch(`${BACKEND_API_URL}/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        // Send only the email and the updated favorites list
        body: JSON.stringify({ email: user.email, favorites: newFavoritesList }),
      });

      console.log("Update favorites list response:", response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Update favorites list response data:", data);

    } catch (error) {
      console.error("Error updating favorites list:", error);
      // fetchFavoritesList(user.email); // Refetch to ensure consistency after error
    }
  };

  // Function to remove item from favorites
  const removeFromFavorites = (fdcId) => {
    const newFavoritesList = favoritesList.filter((item) => item.fdcId !== fdcId);
    setFavoritesList(newFavoritesList);
    updateFavoritesListBackend(newFavoritesList); // Update backend
  };

  return (
    <div>
      <h1>Your Favorite Products</h1>
      {isLoading ? (
        <p>Loading favorites...</p>
      ) : !isLoggedIn ? (
         <p>Please log in to see your favorite items.</p>
      ) : (
        <FavoritesList
          favoritesList={favoritesList}
          removeFromFavorites={removeFromFavorites}
        />
      )}
    </div>
  );
};

export default FavoritesPage;