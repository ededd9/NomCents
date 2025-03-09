import { useState } from "react";
import "./Homepage.css";

function Homepage() {
  const [product, setProduct] = useState("");
  const [results, setResults] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const searchProducts = async () => {
    try {
      const apiKey = "ErqPLe9V080QM2baXIjUt40zxkon8al2JBfwqKJN";
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${product}&pageSize=10&api_key=${apiKey}`
      );
      const data = await response.json();
      setResults(data.foods);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  //adding current product state to grocery list
  // const addToGroceryList = (product) => {
  //   setGroceryList([...groceryList, product]);
  // };

  const toggleGroceryList = (product) => {
    if (groceryList.some((item) => item.fdcId === product.fdcId)) {
      setGroceryList(
        groceryList.filter((item) => item.fdcId !== product.fdcId)
      );
    } else {
      setGroceryList([...groceryList, product]);
    }
  };
  return (
    <div className="Homepage">
      <h1>NomCents</h1>

      <div>
        <input
          type="text"
          placeholder="Search for a product..."
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
        <button onClick={searchProducts}>Search</button>
      </div>

      <div>
        <h2>Search Results</h2>
        <ul>
          <div className="search-results">
            {results.map((product) => (
              <div key={product.id}>
                <div className="product-card">
                  <h3>{product.description}</h3>
                  <p>Brand: {product.brandName}</p>
                  <p>Ingredients: {product.ingredients}</p>
                  <p>
                    <ul>
                      {product.foodNutrients
                        ? product.foodNutrients.map((nutrient) => (
                            <li>
                              {nutrient.nutrientName}: {nutrient.value}
                            </li>
                          ))
                        : "None"}
                    </ul>
                  </p>
                  <button onClick={() => toggleGroceryList(product)}>
                    {groceryList.some((item) => item.fdcId == product.fdcId)
                      ? "Remove from Grocery List"
                      : "Add to Grocery List"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ul>
      </div>
      <button>Load More</button>

      {/* Grocery List */}
      <div className="grocery-list-section">
        <h2>Grocery List</h2>
        <ul>
          {groceryList.map((item, index) => (
            <li key={index}>
              <h3>{item.brandName}</h3>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Homepage;
