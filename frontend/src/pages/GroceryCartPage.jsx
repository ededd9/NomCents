// src/pages/GroceryCartPage.jsx
import { useState, useEffect, useContext } from "react";
import GroceryCart from "../components/GroceryCart";
import { LoginContext } from "../contexts/LoginContext";
import "./GroceryCartPage.css";

const BACKEND_API_URL = "http://127.0.0.1:5000/api";

const GroceryCartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const { isLoggedIn, user } = useContext(LoginContext);
  const [cartValue, setCartValue] = useState(0);
  const [weekTotal, setWeekTotal] = useState(0);


  // Fetch grocery list when user logs in or changes
  useEffect(() => {
    if (isLoggedIn && user) {

      fetchGroceryList(user.email);
    } else {
        // Clear cart if user logs out
        setCartItems([]);
    }
  }, [isLoggedIn, user]);

  // Function to fetch grocery list from backend
  const fetchGroceryList = async (email) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/user?email=${email}`);
      if (response.ok) {
        const userData = await response.json();
        console.log("User data fetched for cart:", userData);
        // Ensure every item has an isChecked property (defaults to false if missing)
        const itemsWithChecked = (userData.groceryList || []).map(item => ({
          ...item,
          isChecked: item.isChecked || false // Add default value if missing
        }));
        await cartTotal(email)
        await weeklyTotal(email)
        setCartItems(itemsWithChecked);
      } else {
          console.error("Failed to fetch grocery list:", response.statusText);
          setCartItems([]); // Clear cart on error
      }
    } catch (error) {
      console.error("Error fetching grocery list:", error);
      setCartItems([]); // Clear cart on error
    }
  };

  // Function to update grocery list in backend (no changes needed here)
  const updateGroceryList = async (newGroceryList) => {
    if (!isLoggedIn || !user) {
        console.error("Cannot update grocery list: User not logged in.");
        // Optional: could refetch to reset state if desired
        // if (user) fetchGroceryList(user.email);
        return;
    }
    try {
      console.log("Updating grocery list for email:", user.email);
      console.log("New grocery list being sent:", newGroceryList); // Log the list being sent

      const response = await fetch(`${BACKEND_API_URL}/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        // Send the complete list including the isChecked status
        body: JSON.stringify({ email: user.email, groceryList: newGroceryList }),
      });

      console.log("Update grocery list response status:", response.status);

      if (!response.ok) {
        // Log error response body if possible
        const errorBody = await response.text();
        console.error("Update grocery list response body:", errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Update grocery list response data:", data);
    } catch (error) {
      console.error("Error updating grocery list:", error);
      // Optional: Add user feedback about the failure
      // Optional: Could attempt to refetch to ensure consistency
      // fetchGroceryList(user.email);
    }
  };

  // Function to increment quantity (no changes needed here)
  const incrementQuantity = (fdcId) => {
    const newGroceryList = cartItems.map((item) =>
      item.fdcId === fdcId ? { ...item, quantity: item.quantity + 1 } : item
    );
    setCartItems(newGroceryList);
    updateGroceryList(newGroceryList);
  };

  // Function to decrement quantity (no changes needed here)
  const decrementQuantity = (fdcId) => {
    const newGroceryList = cartItems.map((item) =>
      item.fdcId === fdcId && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    // No need to filter here, just update quantity
    setCartItems(newGroceryList);
    updateGroceryList(newGroceryList);
  };

  // Function to remove item (no changes needed here)
  const removeItem = (fdcId) => {
    const newGroceryList = cartItems.filter((item) => item.fdcId !== fdcId);
    setCartItems(newGroceryList);
    updateGroceryList(newGroceryList);
  };

  // --- NEW Function to toggle checked status ---
  const toggleChecked = (fdcId) => {
    const newGroceryList = cartItems.map((item) =>
      item.fdcId === fdcId ? { ...item, isChecked: !item.isChecked } : item
    );
    setCartItems(newGroceryList);
    updateGroceryList(newGroceryList); // Persist the change to the backend
  };
  // --- End of NEW Function ---
  const cartTotal = async (email) => {

    try {
      const response = await fetch(`${BACKEND_API_URL}/usercartvalue?email=${email}`);
      if (response.ok) {
        const data = await response.json();
     
        setCartValue(data.cartValue);
      } else {
          console.error("Failed to fetch grocery listprice:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching grocery listprice:", error);
    }
  };
  const weeklyTotal = async (email) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/userweektotal?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        setWeekTotal(data.total);
        console.log("Weekly total fetched:", data.weekTotal);
      } else {
          console.error("Failed to fetch grocery listprice:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching grocery listprice:", error);
    }
  }

    return (
    <div className="GroceryCartPage">
      <h1>Grocery List</h1>
       {/* Display message if not logged in */}
       {!isLoggedIn && <p>Please log in to view your grocery list.</p>}
       {/* Render GroceryCart only if logged in */}
       {isLoggedIn && (
        <GroceryCart
            cartValue={cartValue}
            weekTotal={weekTotal}
            cartItems={cartItems}
            incrementQuantity={incrementQuantity}
            decrementQuantity={decrementQuantity}
            removeItem={removeItem}
            toggleChecked={toggleChecked} // <-- Pass the new function
        />
       )}
    </div>
  );
};

export default GroceryCartPage;