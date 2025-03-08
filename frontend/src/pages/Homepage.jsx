import { useState } from "react";

function Homepage() {
  const [product, setProduct] = useState("");
  const [results, setResults] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const searchProducts = async () => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${product}&page_size=10&json=true`
      );
      const data = await response.json();
      setResults(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  //adding current product state to grocery list
  const addToGroceryList = (product) => {
    setGroceryList([...groceryList, product]);
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
          {results.map((product) => (
            <li key={product.id}>
              <h3>{product.product_name}</h3>
              <p>Brand: {product.brands}</p>
              <p>
                <img src={product.image_url}></img>
              </p>
              <button onClick={() => addToGroceryList(product)}>
                Add to Grocery List
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Grocery List */}
      <div className="grocery-list-section">
        <h2>Grocery List</h2>
        <ul>
          {groceryList.map((item, index) => (
            <li key={index}>
              <h3>{item.product_name}</h3>
              <p>Brand: {item.brands}</p>
              <p>Image: </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Homepage;
