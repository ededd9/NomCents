import { useState, useEffect, useContext } from "react";
import GroceryCart from "../components/GroceryCart";
import { LoginContext } from "../contexts/LoginContext";
//import "./GroceryCartPage.css";

const BACKEND_API_URL = "http://127.0.0.1:5000/api";

const GroceryCartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const { isLoggedIn, user } = useContext(LoginContext);

  // Fetch grocery list when user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchGroceryList(user.email);
    }
  }, [isLoggedIn, user]);

  // Function to fetch grocery list from backend
  const fetchGroceryList = async (email) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/user?email=${email}`);
      if (response.ok) {
        const userData = await response.json();
        console.log("User data:", userData);
        setCartItems(userData.groceryList || []);
      }
    } catch (error) {
      console.error("Error fetching grocery list:", error);
    }
  };

  // Function to update grocery list in backend
  const updateGroceryList = async (newGroceryList) => {
    try {
      console.log("Updating grocery list for email:", user.email);
      console.log("New grocery list:", newGroceryList);

      const response = await fetch(`${BACKEND_API_URL}/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email, groceryList: newGroceryList }),
      });

      console.log("Update grocery list response:", response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Update grocery list response data:", data);
    } catch (error) {
      console.error("Error updating grocery list:", error);
    }
  };

  // Function to increment quantity
  const incrementQuantity = (fdcId) => {
    const newGroceryList = cartItems.map((item) =>
      item.fdcId === fdcId ? { ...item, quantity: item.quantity + 3 } : item
    );
    setCartItems(newGroceryList);
    updateGroceryList(newGroceryList);
  };

  // Function to decrement quantity
  const decrementQuantity = (fdcId) => {
    const newGroceryList = cartItems.map((item) =>
      item.fdcId === fdcId && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    setCartItems(newGroceryList);
    updateGroceryList(newGroceryList);
  };

  // Function to remove item
  const removeItem = (fdcId) => {
    const newGroceryList = cartItems.filter((item) => item.fdcId !== fdcId);
    setCartItems(newGroceryList);
    updateGroceryList(newGroceryList);
  };

  return (
    <div>
      <h1>Grocery Cart</h1>
      <GroceryCart
        cartItems={cartItems}
        incrementQuantity={incrementQuantity}
        decrementQuantity={decrementQuantity}
        removeItem={removeItem}
      />
    </div>
  );
};

export default GroceryCartPage;
