import React from "react";

// Accept groceryList and addToGroceryList as props
const FavoritesList = ({
  favoritesList,
  groceryList,
  removeFromFavorites,
  addToGroceryList,
}) => {
  return (
    <div style={{ margin: "0 auto", width: "80%" }}>
      {favoritesList.length === 0 ? (
        <p>You haven't favorited any items yet.</p>
      ) : (
        <ul style={{ listStyleType: "none", padding: 0, width: "100%" }}>
          {favoritesList.map((product) => {
            // Check if the current favorite item is already in the grocery list
            const isInCart = groceryList.some(
              (cartItem) => cartItem.fdcId === product.fdcId
            );

            return (
              <li
                key={product.fdcId}
                style={{
                  width: "100%",
                  border: "1px solid #888",
                  borderRadius: "4px",
                  marginBottom: "15px",
                  padding: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  backgroundColor: "rgba(249, 249, 249, 0.7)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    textAlign: "left",
                  }}
                >
                  {/* Ensure product.name or product.description is available */}
                  <h3
                    style={{
                      margin: "0 0 5px 0",
                      textAlign: "left",
                      fontWeight: "bold",
                    }}
                  >
                    {product.name || product.description}
                  </h3>
                  <p
                    style={{
                      margin: "5px 0",
                      textAlign: "left",
                    }}
                  >
                    <strong>Brand:</strong>{" "}
                    {product.brandOwner || product.brandName || "N/A"}
                  </p>
                  <p
                    style={{
                      margin: "5px 0",
                      textAlign: "left",
                    }}
                  >
                    <strong>Price:</strong>{" "}
                    {product.price === "n/a"
                      ? "Not available"
                      : `$${product.price}`}
                  </p>
                  <p
                    style={{
                      margin: "5px 0",
                      textAlign: "left",
                    }}
                  >
                    <strong>FDC ID:</strong> {product.fdcId}
                  </p>
                  {/* Add more product details if needed */}
                </div>
                <div className="button-container"
                  style={{
                    marginLeft: "30px",
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                    alignSelf: "flex-end",
                  }}
                >
                  <button
                    onClick={() => removeFromFavorites(product.fdcId)}
                    style={{
                      color: "white",
                      padding: "8px 12px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      backgroundColor: "#000000d7",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Remove from Favorites
                  </button>
                  {/* --- Add to Cart Button --- */}
                  <button
                    onClick={() => addToGroceryList(product)}
                    disabled={isInCart} // Disable button if item is already in the cart
                    style={{
                      backgroundColor: isInCart ? "#000000d7" : "#000000d7", // Visual feedback
                      color: isInCart ? "white" : "white",
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: isInCart ? "default" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isInCart ? "In Grocery List" : "Add to Grocery List"}
                  </button>
                  {/* --- End Add to Cart Button --- */}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FavoritesList;
