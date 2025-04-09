import React from 'react';

// Accept groceryList and addToGroceryList as props
const FavoritesList = ({ favoritesList, groceryList, removeFromFavorites, addToGroceryList }) => {

  return (
    <div>
      {favoritesList.length === 0 ? (
        <p>You haven't favorited any items yet.</p>
      ) : (
        <ul>
          {favoritesList.map((product) => {
            // Check if the current favorite item is already in the grocery list
            const isInCart = groceryList.some(cartItem => cartItem.fdcId === product.fdcId);

            return (
              <li key={product.fdcId} style={{ borderBottom: "1px solid #ccc", marginBottom: "10px", paddingBottom: "10px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {/* Ensure product.name or product.description is available */}
                  <h3>{product.name || product.description}</h3>
                  <p>Brand: {product.brandOwner || product.brandName || 'N/A'}</p>
                  <p>FDC ID: {product.fdcId}</p>
                  {/* Add more product details if needed */}
                </div>
                <div>
                  <button onClick={() => removeFromFavorites(product.fdcId)} style={{ color: "red", marginRight: '10px' }}>
                    Remove from Favorites
                  </button>
                  {/* --- Add to Cart Button --- */}
                  <button
                    onClick={() => addToGroceryList(product)}
                    disabled={isInCart} // Disable button if item is already in the cart
                    style={{ backgroundColor: isInCart ? 'grey' : 'green' }} // Visual feedback
                  >
                    {isInCart ? 'In Cart' : 'Add to Cart'}
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