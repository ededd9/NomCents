// src/pages/ViewProducts.jsx
import { useState, useContext, useEffect } from "react";
import { LoginContext } from "../contexts/LoginContext";
import Popup from "../components/PopUp";
import "./ViewProducts.css";

const BACKEND_API_URL = "http://127.0.0.1:5000/api";

function ViewProducts() {
  const [product, setProduct] = useState("");
  const [results, setResults] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [favoritesList, setFavoritesList] = useState([]); // <-- State for favorites (KEEP)
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Pop up state
  const { isLoggedIn, user } = useContext(LoginContext);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showLoginButton, setShowLoginButton] = useState(false);

  // Search filter state
  const [dataType, setDataType] = useState([]);
  const [sortBy, setSortBy] = useState("dataType.keyword");
  const [sortOrder, setSortOrder] = useState("asc");
  const [brandOwner, setBrandOwner] = useState("");

  // Fetch user data (grocery list and favorites) when user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchUserData(user.email);
    } else {
      // Clear lists if user logs out
      setGroceryList([]);
      setFavoritesList([]); // <-- Clear favorites list on logout (KEEP)
    }
  }, [isLoggedIn, user]);

  // Function to fetch user data (grocery list and favorites) from backend
  const fetchUserData = async (email) => { // <-- Function now fetches favorites too (KEEP)
    try {
      const response = await fetch(`${BACKEND_API_URL}/user?email=${email}`);
      if (response.ok) {
        const userData = await response.json();
        console.log("User data fetched:", userData);
        setGroceryList(userData.groceryList || []);
        setFavoritesList(userData.favorites || []); // <-- Set favorites list (KEEP)
      } else {
          console.error("Failed to fetch user data:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Function to update grocery list in backend
  const updateGroceryListBackend = async (email, newGroceryList) => {
    try {
      await fetch(`${BACKEND_API_URL}/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, groceryList: newGroceryList }),
      });
      // Add response handling if needed
    } catch (error) {
      console.error("Error updating grocery list:", error);
    }
  };

  // Function to update favorites list in backend <-- New function for favorites (KEEP)
  const updateFavoritesListBackend = async (email, newFavoritesList) => {
    try {
      await fetch(`${BACKEND_API_URL}/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        // Send only email and the updated favorites list
        body: JSON.stringify({ email, favorites: newFavoritesList }),
      });
       // Add response handling if needed
    } catch (error) {
      console.error("Error updating favorites list:", error);
    }
  };


  // Function to search for products
  const searchProducts = async (page = 1) => {
    // ... (keep existing searchProducts logic from before)
    try {
      // Handle case where page # > total pages
      if (page > totalPages && page !== 1) {
        console.warn("Page number exceeds total pages. No more results to fetch.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const response = await fetch(
        `${BACKEND_API_URL}/search?product=${product}&page=${page}&pageSize=10&dataType=${dataType.join(',')}&sortBy=${sortBy}&sortOrder=${sortOrder}&brandOwner=${brandOwner}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

       // Reset results on new search (page 1), append otherwise
      if (page === 1) {
        setResults(data.results);
        setCurrentPage(1); // Reset current page on new search
        setTotalPages(data.paging_info.total_pages);
      } else {
        setResults((prevResults) => [...prevResults, ...data.results]);
      }

      setIsLoading(false);

    } catch (error) {
      console.error("Error fetching products:", error);
      setIsLoading(false);
    }
  };

  // Function to load more products
  const loadMoreProducts = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    searchProducts(nextPage);
  };


  // Functions for adding/removing/incrementing/decrementing item from grocery list
  const addToGroceryList = (product) => {
    // ... (keep existing addToGroceryList logic)
    if (isLoggedIn && user) {
      const existingProduct = groceryList.find(
        (item) => item.fdcId === product.fdcId
      );
      let newGroceryList;
      if (existingProduct) {
        existingProduct.quantity += 1;
        newGroceryList = [...groceryList];
      } else {
        const productToAdd = { ...product, quantity: 1 };
        newGroceryList = [...groceryList, productToAdd];
      }
      setGroceryList(newGroceryList);
      updateGroceryListBackend(user.email, newGroceryList);
      setShowPopup(true);
      setPopupMessage("Product added to grocery list!");
      setShowLoginButton(false);
      setTimeout(() => setShowPopup(false), 3000); // Use the 3-second timeout
    } else {
      setShowPopup(true);
      setPopupMessage("Please log in to add products to your grocery list.");
      setShowLoginButton(true);
    }
  };

  const removeFromGroceryList = (product) => {
    // ... (keep existing removeFromGroceryList logic)
     if (isLoggedIn && user) {
      const newGroceryList = groceryList.filter((item) => item.fdcId !== product.fdcId);
      setGroceryList(newGroceryList);
      updateGroceryListBackend(user.email, newGroceryList);
      // Optional: Show confirmation popup
    }
  };

  const incrementQuantity = (product) => {
    // ... (keep existing incrementQuantity logic)
     if (isLoggedIn && user) {
      const newGroceryList = groceryList.map((item) =>
        item.fdcId === product.fdcId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setGroceryList(newGroceryList);
      updateGroceryListBackend(user.email, newGroceryList);
    }
  };

  const decrementQuantity = (product) => {
    // ... (keep existing decrementQuantity logic)
    if (isLoggedIn && user) {
      const newGroceryList = groceryList.map((item) =>
        item.fdcId === product.fdcId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => !(item.fdcId === product.fdcId && item.quantity <= 1)); // Also remove if quantity becomes 0 or less

      const itemExists = newGroceryList.some(item => item.fdcId === product.fdcId);
      if (!itemExists && product.quantity === 1) {
           removeFromGroceryList(product);
           return;
      }

      setGroceryList(newGroceryList);
      updateGroceryListBackend(user.email, newGroceryList);
    }
  };

  // Functions for adding/removing item from favorites list <-- New Functions (KEEP)
  const addToFavorites = (product) => {
    if (isLoggedIn && user) {
       if (favoritesList.some(item => item.fdcId === product.fdcId)) {
           console.log("Product already in favorites");
           return; // Or show a message
       }
       const { quantity, ...productData } = product; // Exclude quantity for favorites
       const newFavoritesList = [...favoritesList, productData];
       setFavoritesList(newFavoritesList);
       updateFavoritesListBackend(user.email, newFavoritesList);
       setShowPopup(true);
       setPopupMessage("Product added to favorites!");
       setShowLoginButton(false);
       setTimeout(() => setShowPopup(false), 3000);
    } else {
        setShowPopup(true);
        setPopupMessage("Please log in to favorite products.");
        setShowLoginButton(true);
    }
  };

  const removeFromFavorites = (product) => {
      if (isLoggedIn && user) {
          const newFavoritesList = favoritesList.filter((item) => item.fdcId !== product.fdcId);
          setFavoritesList(newFavoritesList);
          updateFavoritesListBackend(user.email, newFavoritesList);
           setShowPopup(true);
           setPopupMessage("Product removed from favorites.");
           setShowLoginButton(false);
           setTimeout(() => setShowPopup(false), 3000);
      }
  };


  // Popup close function
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  // Function to handle data type checkbox changes
  const handleDataTypeChange = (event) => {
    // ... (keep existing handleDataTypeChange logic)
    const value = event.target.value;
    const isChecked = event.target.checked;
    setDataType((prevDataTypes) => {
      if (isChecked) {
        return [...prevDataTypes, value];
      } else {
        return prevDataTypes.filter((type) => type !== value);
      }
    });
  };


  return (
    <div className="ViewProducts">
      <h1>NomCents</h1>

      <div className="search-filters">
        {/* Search Inputs */}
         <input
          type="text"
          placeholder="Search for a product..."
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchProducts(1)}
        />
        <button onClick={() => searchProducts(1)} disabled={isLoading}>Search</button>

        {/* Filters */}
        <fieldset>
          <legend>Data Type</legend>
           <label>
            <input type="checkbox" value="Branded" onChange={handleDataTypeChange} checked={dataType.includes("Branded")} /> Branded
          </label>
          <label>
            <input type="checkbox" value="Foundation" onChange={handleDataTypeChange} checked={dataType.includes("Foundation")} /> Foundation
          </label>
          <label>
            <input type="checkbox" value="Survey (FNDDS)" onChange={handleDataTypeChange} checked={dataType.includes("Survey (FNDDS)")} /> Survey (FNDDS)
          </label>
           <label>
            <input type="checkbox" value="SR Legacy" onChange={handleDataTypeChange} checked={dataType.includes("SR Legacy")} /> SR Legacy
          </label>
        </fieldset>

         <label htmlFor="sortBy">Sort By</label>
        <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="dataType.keyword">Data Type</option>
          <option value="lowercaseDescription.keyword">Description</option>
          <option value="fdcId">FDC ID</option>
          <option value="brandOwner.keyword">Brand Owner</option>
          <option value="publishedDate">Published Date</option>
        </select>

        <label htmlFor="sortOrder">Sort Order</label>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        <label htmlFor="brandOwner">Brand Owner</label>
        <input
          type="text"
          id="brandOwner"
          placeholder="Enter brand owner (optional)..."
          value={brandOwner}
          onChange={(e) => setBrandOwner(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchProducts(1)}
        />
      </div>

      <div>
        <h2>Search Results</h2>
        {isLoading && currentPage === 1 ? <p>Loading results...</p> : null}
        {results.length === 0 && !isLoading ? <p>No products found.</p> : null}
        <div className="search-results"> {/* Changed from ul to div for card layout */}
            {results.map((product) => {
              const inGroceryList = groceryList.find(
                (item) => item.fdcId === product.fdcId
              );
              const isFavorite = favoritesList.some( // <-- Check if product is favorite (KEEP)
                 (item) => item.fdcId === product.fdcId
              );
              return (
                <div key={product.fdcId} className="product-card"> {/* Use div for card layout */}
                    <h3>{product.description || product.name}</h3>
                    <p> Brand Owner: {product.brandOwner || 'N/A'}</p>
                    <p> Data Type: {product.dataType}</p>
                    <p> FDC ID: {product.fdcId}</p>
                    <p>Ingredients: {product.ingredients || 'N/A'}</p>

                    {/* RESTORED: Original Nutrients Rendering */}
                    <p>
                      Nutrients:
                      <ul>
                        {product.foodNutrients && product.foodNutrients.length > 0
                          ? product.foodNutrients.slice(0, 5).map((nutrient) => ( // Limit displayed nutrients
                              <li key={nutrient.nutrientId}>
                                {nutrient.nutrientName || nutrient.nutrient?.name}: {nutrient.amount || nutrient.value}{nutrient.nutrient?.unitName || nutrient.unitName}
                              </li>
                            ))
                          : " Not available"}
                      </ul>
                      {product.foodNutrients && product.foodNutrients.length > 5 ? '...' : ''}
                    </p>
                    {/* --- End of Restored Nutrients --- */}

                    {/* Favorite Button (KEEP) */}
                    {isFavorite ? (
                       <button onClick={() => removeFromFavorites(product)} style={{backgroundColor: 'lightcoral', marginRight: '10px'}}> {/* Added margin */}
                         Unfavorite
                       </button>
                    ) : (
                       <button onClick={() => addToFavorites(product)} style={{backgroundColor: 'lightgreen', marginRight: '10px'}}> {/* Added margin */}
                         Favorite
                       </button>
                    )}

                    {/* Grocery List Buttons */}
                    {inGroceryList ? (
                      <div style={{display: 'inline-block'}}> {/* Use inline-block to keep buttons together */}
                        <button onClick={() => decrementQuantity(product)}>
                          -
                        </button>
                        <span style={{margin: '0 5px'}}>In Cart: {inGroceryList.quantity}</span>
                        <button onClick={() => incrementQuantity(product)}>
                          +
                        </button>
                        <button onClick={() => removeFromGroceryList(product)} style={{marginLeft: '10px', color: 'red'}}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => addToGroceryList(product)}>
                        Add to Grocery List
                      </button>
                    )}
                 </div>
              );
            })}
          </div>

         {showPopup && (
            <Popup
            message={popupMessage}
            closePopup={handleClosePopup}
            showLoginButton={showLoginButton}
            />
        )}
        {/* Load More Button */}
        {results.length > 0 && currentPage < totalPages && (
             <button onClick={loadMoreProducts} disabled={isLoading} style={{ marginTop: '20px' }}> {/* Added margin top */}
                 {isLoading ? "Loading..." : "Load More"}
            </button>
        )}
      </div>

    </div>
  );
}

export default ViewProducts;