import { useState, useContext } from "react";
import { LoginContext } from "../contexts/LoginContext";
import Popup from "../components/PopUp";
import "./ViewProducts.css";

function ViewProducts() {
  const [product, setProduct] = useState("");
  const [results, setResults] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Stuff for conditional (logged in/logged out) add to cart pop up display
  const { isLoggedIn } = useContext(LoginContext);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showLoginButton, setShowLoginButton] = useState(false);

  // Function to search for products
  const searchProducts = async (page = 1) => {
    
    try {
      
      setIsLoading(true);

      const response = await fetch(
        `http://127.0.0.1:5000/api/search?product=${product}&page=${page}&pageSize=10`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (page === 1) {
        setResults(data.results);
      } else {
        setResults((prevResults) => [...prevResults, ...data.results]);
      }

      setTotalPages(data.paging_info.total_pages);
      setIsLoading(false);
    
    } catch (error) {

      console.error("Error fetching products:", error);
      setIsLoading(false);
    }
  };

  const loadMoreProducts = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    searchProducts(nextPage);
  };


  // Functions for adding/removing/incrementing/decrementing item from grocery list
  const addToGroceryList = (product) => {
  
    // If user is logged in, add product to grocery list and show success pop up
    if (isLoggedIn) {
  
      const existingProduct = groceryList.find(
        (item) => item.fdcId === product.fdcId
      );
  
      if (existingProduct) {
        // If product already exists in grocery list, increment quantity by 1
        existingProduct.quantity += 1;
        setGroceryList([...groceryList]);
      } else {
  
        // If product doesn't exist in grocery list, add it with quantity of 1
        product.quantity = 1;
        setGroceryList([...groceryList, product]);
      }
  
      setShowPopup(true);
      setPopupMessage("Product added to grocery list!");
      setShowLoginButton(false);

      // Close popup after 5 seconds if user doesn't click on it
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
  
    } else {
  
      // Else, show popup prompting user to login with button to login page
      setShowPopup(true);
      setPopupMessage("Please log in to add products to your grocery list.");
      setShowLoginButton(true);
    }
  };


  const removeFromGroceryList = (product) => {
  
    // Remove product from grocery list and show success pop up
    setGroceryList(groceryList.filter((item) => item.fdcId !== product.fdcId));
  
    setShowPopup(true);
    setPopupMessage("Product removed from grocery list!");
    setShowLoginButton(false);

    // Close popup after 5 seconds if user doesn't click OK
    setTimeout(() => {
      setShowPopup(false);
    }, 5000);
  };

  
  const incrementQuantity = (product) => {
  
    // Increment quantity of product in grocery list
    setGroceryList(
      groceryList.map((item) =>
        item.fdcId === product.fdcId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  
  const decrementQuantity = (product) => {
  
    // Decrement quantity of product in grocery list
    setGroceryList(
      groceryList.map((item) =>
        item.fdcId === product.fdcId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  
  // Popup close function to pass to Popup component
  const handleClosePopup = () => {
    setShowPopup(false);
  };


  return (
    <div className="ViewProducts">
      <h1>NomCents</h1>

      <div>
        <input
          type="text"
          placeholder="Search for a product..."
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
        <button onClick={() => searchProducts(1)}>Search</button>
      </div>

      <div>
        <h2>Search Results</h2>
        <ul>
          <div className="search-results">
            {results.map((product) => {
              const inGroceryList = groceryList.find(
                (item) => item.fdcId === product.fdcId
              );
              return (
                <div key={product.fdcId}>
                  <div className="product-card">
                    <h3>{product.name}</h3>
                    <p>Brand: {product.brandName}</p>
                    <p>Ingredients: {product.ingredients}</p>
                    <p>
                      <ul>
                        {product.foodNutrients
                          ? product.foodNutrients.map((nutrient) => (
                              <li key={nutrient.nutrientId}>
                                {nutrient.nutrientName}: {nutrient.value}
                              </li>
                            ))
                          : "None"}
                      </ul>
                    </p>
                    {inGroceryList ? (
                      <>
                        <button onClick={() => decrementQuantity(product)}>
                          -
                        </button>
                        <span>{inGroceryList.quantity}</span>
                        <button onClick={() => incrementQuantity(product)}>
                          +
                        </button>
                        <button onClick={() => removeFromGroceryList(product)}>
                          Remove from Grocery List
                        </button>
                      </>
                    ) : (
                      <button onClick={() => addToGroceryList(product)}>
                        Add to Grocery List
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ul>
      </div>
      {showPopup && (
        <Popup
          message={popupMessage}
          closePopup={handleClosePopup}
          showLoginButton={showLoginButton}
        />
      )}
      <button onClick={loadMoreProducts} disabled={isLoading || currentPage >= totalPages}>
        {isLoading ? "Loading..." : "Load More"}
      </button>
    </div>
  );
}

export default ViewProducts;