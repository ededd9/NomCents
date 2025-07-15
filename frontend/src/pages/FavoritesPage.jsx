import { useState, useEffect, useContext } from "react";
import FavoritesList from "../components/FavoritesList";
import { LoginContext } from "../contexts/LoginContext";
import Popup from "../components/PopUp";
import "./FavoritesPage.css";

const BACKEND_API_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api";

const FavoritesPage = () => {
  const [favoritesList, setFavoritesList] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const { isLoggedIn, user } = useContext(LoginContext);
  const [isLoading, setIsLoading] = useState(false);

  // --- Popup State ---
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showLoginButton, setShowLoginButton] = useState(false);
  // --- End Popup State ---

  // Fetch user data (favorites and grocery list) when user logs in or changes
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchUserData(user.email); // Renamed function
    } else {
      // Clear lists if user logs out
      setFavoritesList([]);
      setGroceryList([]);
    }
  }, [isLoggedIn, user]);

  // Function to fetch user data from backend
  const fetchUserData = async (email) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/user?email=${email}`);
      if (response.ok) {
        const userData = await response.json();
        console.log("User data fetched for Favorites Page:", userData);
        setFavoritesList(userData.favorites || []);
        setGroceryList(userData.groceryList || []); // <-- Fetch and set grocery list
      } else {
        console.error("Failed to fetch user data:", response.statusText);
        setFavoritesList([]);
        setGroceryList([]); // Clear on error
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setFavoritesList([]);
      setGroceryList([]); // Clear on error
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update favorites list in backend
  const updateFavoritesListBackend = async (newFavoritesList) => {
    if (!isLoggedIn || !user) return;
    try {
      console.log("Updating favorites list for email:", user.email);
      const response = await fetch(`${BACKEND_API_URL}/user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          favorites: newFavoritesList,
        }),
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      console.log("Update favorites list successful");
    } catch (error) {
      console.error("Error updating favorites list:", error);
      // fetchUserData(user.email);
    }
  };

  // Function to update grocery list in backend (similar to ViewProducts)
  const updateGroceryListBackend = async (newGroceryList) => {
    // <-- Added function
    if (!isLoggedIn || !user) return;
    try {
      console.log(
        "Updating grocery list from Favorites page for email:",
        user.email
      );
      const response = await fetch(`${BACKEND_API_URL}/user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Send only email and the updated grocery list
        body: JSON.stringify({
          email: user.email,
          groceryList: newGroceryList,
        }),
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      console.log("Update grocery list successful");
    } catch (error) {
      console.error("Error updating grocery list:", error);
    }
  };

  // Function to remove item from favorites
  const removeFromFavorites = (fdcId) => {
    const newFavoritesList = favoritesList.filter(
      (item) => item.fdcId !== fdcId
    );
    setFavoritesList(newFavoritesList);
    updateFavoritesListBackend(newFavoritesList); // Update backend
  };

  // Function to add item to grocery list (similar to ViewProducts) <-- Added function
  const addToGroceryList = (productToAdd) => {
    if (!isLoggedIn || !user) {
      // This shouldn't typically happen on this page, but handle defensively
      setPopupMessage("Please log in first.");
      setShowLoginButton(true);
      setShowPopup(true);
      return;
    }

    const existingProduct = groceryList.find(
      (item) => item.fdcId === productToAdd.fdcId
    );

    let newGroceryList;
    if (existingProduct) {
      // Increment quantity if already in list
      newGroceryList = groceryList.map((item) =>
        item.fdcId === productToAdd.fdcId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      // Add new item with quantity 1
      // Ensure the product object structure is consistent with what cart expects
      const itemForCart = { ...productToAdd, quantity: 1 };
      newGroceryList = [...groceryList, itemForCart];
    }

    setGroceryList(newGroceryList); // Update local state immediately
    updateGroceryListBackend(newGroceryList); // Update backend

    // Show confirmation popup
    setPopupMessage(
      `${productToAdd.name || productToAdd.description} added to cart!`
    );
    setShowLoginButton(false);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  // Popup close function
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="FavoritesPage">
      <h1 className="Favorites-title">Favorites </h1>
      {isLoading ? (
        <p>Loading favorites...</p>
      ) : !isLoggedIn ? (
        <p>Please log in to see your favorite items.</p>
      ) : (
        <FavoritesList
          favoritesList={favoritesList}
          groceryList={groceryList}
          n
          removeFromFavorites={removeFromFavorites}
          addToGroceryList={addToGroceryList}
        />
      )}
      {/* --- Popup Component --- */}
      {showPopup && (
        <Popup
          message={popupMessage}
          closePopup={handleClosePopup}
          showLoginButton={showLoginButton}
        />
      )}
      {/* --- End Popup Component --- */}
    </div>
  );
};

export default FavoritesPage;
