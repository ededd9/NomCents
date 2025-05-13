// src/pages/ViewProducts.jsx
import { useState, useContext, useEffect } from "react";
import { LoginContext } from "../contexts/LoginContext";
import Popup from "../components/PopUp";
import FoodLogModal from "../components/FoodLogModal";
import "./ViewProducts.css";
import Select from "react-select";

const BACKEND_API_URL = "http://127.0.0.1:5000/api";

function ViewProducts() {
  const [product, setProduct] = useState("");
  const [results, setResults] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [favoritesList, setFavoritesList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usdaPage, setUsdaPage] = useState(1);
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

  // Stuff for showing only products with prices
  const [showOnlyPriced, setShowOnlyPriced] = useState(false);

  // Stuff for product details popup
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

  // Stuff for food log modal
  const [showLogModal, setShowLogModal] = useState(false);

  // Stuff for store selection
  const [displayedZipCode, setDisplayedZipCode] = useState(""); // Tracks user input
  const [zipCode, setZipCode] = useState(""); // Tracks validated zip code
  const [storeOptions, setStoreOptions] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);

  const [priceComparisonData, setPriceComparisonData] = useState([]);
  const [showPriceComparison, setShowPriceComparison] = useState(false);

  // Fetch lists when user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchUserData(user.email);
    } else {
      // Reset list states if user logs out
      setGroceryList([]);
      setFavoritesList([]);
    }
  }, [isLoggedIn, user]);

  // Each time the zipcode field entered by user changes, fetch the updated stores for the searchable dropdown
  useEffect(() => {
    if (zipCode) {
      fetchStores();
    } else {
      setStoreOptions([]);
    }
  }, [zipCode]);

  useEffect(() => {
    // Reset showPriceComparison when selectedProduct changes
    setShowPriceComparison(false);
  }, [selectedProduct]);

  // Function to fetch user data (grocery list and favorites) from backend
  const fetchUserData = async (email) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/user?email=${email}`);

      // If response is okay...
      if (response.ok) {
        // Set user data based on fetched data
        const userData = await response.json();
        console.log("User data:", userData);

        // Set list states based on fetched data
        setGroceryList(userData.groceryList || []);
        setFavoritesList(userData.favorites || []);
      }
    } catch (error) {
      console.error("Error fetching grocery list:", error);
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

      // fetch updated user data to log in console for debugging
      fetchUserData(email);
    } catch (error) {
      console.error("Error updating grocery list:", error);
    }
  };

  // Function to update favorites list in backend
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

      // fetch updated user data to log in console for debugging
      fetchUserData(email);
    } catch (error) {
      console.error("Error updating favorites list:", error);
    }
  };

  // Function to get and set locations list based on zipcode entered by user
  const fetchStores = async () => {
    try {
      const res = await fetch(
        `${BACKEND_API_URL}/locations?zipcode=${zipCode}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch stores: ${res.statusText}`);
      }

      const data = await res.json();

      // Map over the returned list of locations
      const formatted = data.map((location) => ({
        label: `${location.address} (${location.city}, ${location.state})`,
        value: location.locationId,
      }));

      setStoreOptions(formatted);
    } catch (err) {
      console.error("Failed to fetch stores:", err);
      setStoreOptions([]); // Clear store options on error
    }
  };

  // Function to search for products
  const searchProducts = async (page = 1) => {
    if (page === 1) {
      setResults([]);
    }
    try {
      // Handle case where page # > total pages
      if (page > totalPages) {
        console.warn(
          "Page number exceeds total pages. No more results to fetch."
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const response = await fetch(
        // Include all query params that aren't null or empty
        `${BACKEND_API_URL}/search?product=${product}&page=${page}&pageSize=10&dataType=${dataType}&sortBy=${sortBy}&sortOrder=${sortOrder}&brandOwner=${brandOwner}&usdaPage=${usdaPage}&showOnlyPriced=${showOnlyPriced}&locationId=${
          selectedStore?.value || ""
        }`
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
      setUsdaPage(data.paging_info.next_usda_page);
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
    // If user is logged in, add product to grocery list and show success pop up
    if (isLoggedIn && user) {
      const existingProduct = groceryList.find(
        (item) => item.fdcId === product.fdcId
      );

      let newGroceryList;

      if (existingProduct) {
        // If product already exists in grocery list, increment quantity by 1
        existingProduct.quantity += 1;
        newGroceryList = [...groceryList];
      } else {
        // If product doesn't exist in grocery list, add it with quantity of 1
        product.quantity = 1;
        newGroceryList = [...groceryList, product];
      }

      setGroceryList(newGroceryList);
      updateGroceryListBackend(user.email, newGroceryList);
      setShowPopup(true);
      setPopupMessage("Product added to grocery list!");
      setShowLoginButton(false);

      // Close popup after 5 seconds
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
    if (isLoggedIn && user) {
      const newGroceryList = groceryList.filter(
        (item) => item.fdcId !== product.fdcId
      );
      setGroceryList(newGroceryList);
      updateGroceryListBackend(user.email, newGroceryList);
      setShowPopup(true);
      setPopupMessage("Product removed from grocery list!");
      setShowLoginButton(false);

      // Close popup after 5 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    }
  };

  const incrementQuantity = (product) => {
    // Increment quantity of product in grocery list
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
    // Decrement quantity of product in grocery list
    if (isLoggedIn && user) {
      const newGroceryList = groceryList.map((item) =>
        item.fdcId === product.fdcId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
      setGroceryList(newGroceryList);
      updateGroceryListBackend(user.email, newGroceryList);
    }
  };

  // Functions for adding/removing item from favorites list <-- New Functions (KEEP)
  const addToFavorites = (product) => {
    if (isLoggedIn && user) {
      if (favoritesList.some((item) => item.fdcId === product.fdcId)) {
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
      const newFavoritesList = favoritesList.filter(
        (item) => item.fdcId !== product.fdcId
      );
      setFavoritesList(newFavoritesList);
      updateFavoritesListBackend(user.email, newFavoritesList);
      setShowPopup(true);
      setPopupMessage("Product removed from favorites.");
      setShowLoginButton(false);
      setTimeout(() => setShowPopup(false), 3000);
    }
  };

  const openLogModal = (product) => {
    console.log("Log Food button clicked for product:", product);
    setSelectedProduct(product);
    setShowLogModal(true);
  };

  const closeLogModal = () => {
    setShowLogModal(false);
  };

  const handleLogSubmit = async (logData) => {
    if (isLoggedIn && user) {
      try {
        const response = await fetch(`${BACKEND_API_URL}/log_food`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email, // need to ensure that this is being defined
            fdcId: logData.fdcId,
            productName: logData.productName, // updated to match modal properties
            servingSize: logData.servingSize,
            mealType: logData.mealType,
            timestamp: logData.timestamp, // might change to just the date later
          }),
        });

        const result = await response.json();
        alert(result.message || "Log added! :)");
        setShowLogModal(false);
      } catch (err) {
        console.error("Error logging food:", err);
        alert("Error logging food.");
        // console.log("User:", user); // for debugging
      }

      //console.log("sending log data:", logData);
      // if someone is not logged in
    } else if (!isLoggedIn || !user) {
      alert("must be logged in to log food");
      return;
    }
  };

  const fetchPriceComparison = async () => {
    try {
      // If already showing, toggle off
      if (showPriceComparison) {
        setShowPriceComparison(false);
        return;
      }

      const locationIds = storeOptions.map((store) => store.value); // Get nearby store IDs
      const response = await fetch(
        `${BACKEND_API_URL}/price_comparison?gtinUpc=${
          selectedProduct.gtinUpc
        }&${locationIds.map((id) => `locationIds=${id}`).join("&")}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPriceComparisonData(data); // Save the prices in state
      setShowPriceComparison(true); // Show the price comparison table
    } catch (err) {
      console.error("Error fetching price comparison:", err);
      setShowPopup(true);
      setPopupMessage("Failed to fetch price comparison.");
    }
  };

  // Popup close function to pass to Popup component
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  // Function to handle data type checkbox changes
  const handleDataTypeChange = (event) => {
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

  const viewProductDetails = (product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    setShowProductDetails(false);
  };
  
  const calculateNutritionScore = (product) => {
    
    let dvA = 0;
    let dvC = 0;
    Object.entries(product.nutrition.vitamins || {}).forEach(([key, value]) => {
      console.log(key, value);
      if (key.includes("Vitamin A")) {
        console.log("Vitamin A value:", value);
        dvA = value/2700;
      }
      
      if (key.includes("Vitamin C")) {
        console.log("Vitamin C value:", value);
        dvC = value/90;
      }
      
    });
    console.log(dvA); 
    console.log(dvC); 
    console.log(product.nutrition);
    console.log(product);
    let score = 0.710 - (0.0538 * product.nutrition.fat)- (0.423 * product.nutrition.saturatedfat) - (0.00398 * product.nutrition.cholesterol) - (0.00254 * product.nutrition.sodium) - (0.0300 * product.nutrition.carbohydrates) + (0.561 * product.nutrition.fiber) - (0.0245 * product.nutrition.sugars) + (0.123 * product.nutrition.protein) + (0.00562 * dvA) + (0.0137 * dvC) + (0.0685 * (product.nutrition.calcium / 1300)) - (0.0186 * (product.nutrition.iron / 18));
    return score;
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
          onKeyDown={(e) => e.key === "Enter" && searchProducts(1)}
        />
        <button onClick={() => searchProducts(1)} disabled={isLoading}>
          Search
        </button>

        {/* Filters */}
        <fieldset>
          <legend>Data Type</legend>
          <label>
            <input
              type="checkbox"
              value="Branded"
              onChange={handleDataTypeChange}
              checked={dataType.includes("Branded")}
            />{" "}
            Branded
          </label>
          <label>
            <input
              type="checkbox"
              value="Foundation"
              onChange={handleDataTypeChange}
              checked={dataType.includes("Foundation")}
            />{" "}
            Foundation
          </label>
          <label>
            <input
              type="checkbox"
              value="Survey (FNDDS)"
              onChange={handleDataTypeChange}
              checked={dataType.includes("Survey (FNDDS)")}
            />{" "}
            Survey (FNDDS)
          </label>
          <label>
            <input
              type="checkbox"
              value="SR Legacy"
              onChange={handleDataTypeChange}
              checked={dataType.includes("SR Legacy")}
            />{" "}
            SR Legacy
          </label>
        </fieldset>

        <label htmlFor="sortBy">Sort By</label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
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
          onKeyDown={(e) => e.key === "Enter" && searchProducts(1)}
        />

        <label>
          <input
            type="checkbox"
            checked={showOnlyPriced}
            onChange={(e) => setShowOnlyPriced(e.target.checked)}
          />
          Show Priced Products Only
        </label>

        <div className="zip-and-store">
          <label htmlFor="zipCode">Enter Zip Code:</label>
          <input
            type="text"
            id="zipCode"
            placeholder="Enter your zip code..."
            value={displayedZipCode} // Bind to displayedZipCode
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                // Allow only numeric input
                setDisplayedZipCode(value); // Update displayedZipCode as the user types
                if (value.length === 5) {
                  setZipCode(value); // Update zipCode only when input is exactly 5 digits
                }
              }
            }}
            maxLength={5} // Limit input to 5 characters
          />

          <label htmlFor="storeSelect">Select Store:</label>
          <Select
            id="storeSelect"
            options={storeOptions}
            value={selectedStore}
            onChange={(selectedOption) => setSelectedStore(selectedOption)}
            placeholder="Select a store..."
            isSearchable
            className="react-select"
            classNamePrefix="react-select"
          />
        </div>
      </div>

      <div>
        <h2>Search Results</h2>
        {isLoading && currentPage === 1 ? <p>Loading results...</p> : null}
        {results.length === 0 && !isLoading ? <p>No products found.</p> : null}
        <div className="search-results">
          {" "}
          {/* Changed from ul to div for card layout */}
          {results.map((product) => {
            const inGroceryList = groceryList.find(
              (item) => item.fdcId === product.fdcId
            );
            const isFavorite = favoritesList.some(
              // <-- Check if product is favorite (KEEP)
              (item) => item.fdcId === product.fdcId
            );
            return (
              <div key={product.fdcId}>
                <div
                  className="product-card"
                  onClick={() => viewProductDetails(product)} // Open product details popup on click
                  style={{ cursor: "pointer" }}
                >
                  <h3>{product.name}</h3>
                  <p>
                    Price at Krogers:{" "}
                    {product.price != "n/a"
                      ? `$${product.price}`
                      : product.price}
                  </p>
                  <p>Brand Owner: {product.brandOwner}</p>
                  <p>Brand Name: {product.brandName}</p>
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          decrementQuantity(product);
                        }}
                      >
                        -
                      </button>
                      <span>{inGroceryList.quantity}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          incrementQuantity(product);
                        }}
                      >
                        +
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromGroceryList(product);
                        }}
                      >
                        Remove from Grocery List
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToGroceryList(product);
                      }}
                    >
                      Add to Grocery List
                    </button>
                  )}
                  {isFavorite ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromFavorites(product);
                      }}
                    >
                      Remove from Favorites
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToFavorites(product);
                      }}
                    >
                      Add to Favorites
                    </button>
                  )}
                  {isLoggedIn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openLogModal(product);
                      }}
                    >
                      Log Food
                    </button>
                  )}
                </div>
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
          <button
            onClick={loadMoreProducts}
            disabled={isLoading}
            style={{ marginTop: "20px" }}
          >
            {" "}
            {/* Added margin top */}
            {isLoading ? "Loading..." : "Load More"}
          </button>
        )}
      </div>

      {/* Product Details Popup */}
      {showProductDetails && selectedProduct && (
        <Popup
          message={
            <div>
              <h1>{selectedProduct.name}</h1>
              <p>Brand: {selectedProduct.brandName}</p>
              <p>Brand Owner: {selectedProduct.brandOwner}</p>
              <p>Ingredients: {selectedProduct.ingredients}</p>
              <p>Package weight/Total amount {selectedProduct.packageSize}</p>
              <h2>Nutrition Per Serving</h2>
              <ul>
                <li>Serving size: {selectedProduct.servingsize}, {selectedProduct.servingSizeUnit} </li>
                <li>Calories: {(selectedProduct.nutrition.calories / selectedProduct.servingsize).toFixed(2)}</li>
                <li>Protein: {(selectedProduct.nutrition.protein / selectedProduct.servingsize).toFixed(2)}</li>
                <li>Fat: {(selectedProduct.nutrition.fat / selectedProduct.servingsize).toFixed(2)}</li> 
                <li>Carbohydrates: {(selectedProduct.nutrition.carbohydrates / selectedProduct.servingsize).toFixed(2)}</li>
                <li>Sugars: {(selectedProduct.nutrition.sugars / selectedProduct.servingsize).toFixed(2)}</li> 
                <li>Fiber: {(selectedProduct.nutrition.fiber / selectedProduct.servingsize).toFixed(2)}</li>
                <li>Cholesterol: {(selectedProduct.nutrition.cholesterol / selectedProduct.servingsize).toFixed(2)}</li>
                <li>Nutrition score: {(calculateNutritionScore(selectedProduct) / selectedProduct.servingsize).toFixed(2)}</li>
              </ul>
              <h2>Vitamins and Minerals</h2>
              <ul>
                {Object.entries(selectedProduct.nutrition.vitamins || {}).map(
                  ([key, value]) => (
                    <li key={key}>
                      {key}: {value}
                    </li>
                  )
                )}
              </ul>

              {showPriceComparison && (
                <div style={{ marginTop: "20px" }}>
                  <h2>Price Comparison</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Store Location</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceComparisonData.map((price) => {
                        const isSelectedStore =
                          price.locationId === selectedStore?.value; // Check if this is the selected store
                        return (
                          <tr key={price.locationId}>
                            <td>
                              {storeOptions.find(
                                (store) => store.value === price.locationId
                              )?.label || "Unknown Store"}
                            </td>
                            <td>
                              {price.price !== "n/a"
                                ? `$${price.price}`
                                : "Not Available"}
                              {isSelectedStore && (
                                <span
                                  style={{
                                    color: "blue",
                                    fontWeight: "bold",
                                    marginLeft: "5px",
                                  }}
                                >
                                  {" ← currently selected store"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedStore && (
                <button
                  onClick={fetchPriceComparison}
                  style={{ marginTop: "10px" }}
                >
                  {showPriceComparison
                    ? "Hide Price Comparison"
                    : "Compare Prices with Other Nearby Stores"}
                </button>
              )}
              <button onClick={closeProductDetails}>Close</button>
            </div>
          }
          closePopup={closeProductDetails}
          showLoginButton={false}
          popupType="product-details"
        />
      )}
      {showPopup && (
        <Popup
          message={popupMessage}
          closePopup={handleClosePopup}
          showLoginButton={showLoginButton}
        />
      )}

      {showLogModal && selectedProduct && (
        <FoodLogModal
          product={selectedProduct}
          onClose={closeLogModal}
          onSubmit={handleLogSubmit}
        />
      )}
    </div>
  );
}

export default ViewProducts;
