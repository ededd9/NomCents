import { useState } from "react";
import GroceryCart from "./GroceryCart";

// Import images from the assets folder

const GroceryCartPage = () => {
  // Initial grocery list with imported images
  const [cartItems, setCartItems] = useState([
    { id: 1, name: "Jason's Sourdough White Ciabattin Bread", image: breadImage, quantity: 1 },
    { id: 2, name: "Jaouda Milk", image: milkImage, quantity: 1 },
    { id: 3, name: "Coca-Cola Zero", image: cokeZeroImage, quantity: 1 },
    { id: 4, name: "Heinz Tomato Ketchup", image: ketchupImage, quantity: 1 },
  ]);

  // Function to increment quantity
  const incrementQuantity = (id) => {
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  // Function to decrement quantity
  const decrementQuantity = (id) => {
    setCartItems(cartItems.map(item => 
      item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
    ));
  };

  // Function to remove item
  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
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