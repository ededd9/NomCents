import React from 'react';

const FavoritesList = ({ favoritesList, removeFromFavorites }) => {
  return (
    <div>
      {favoritesList.length === 0 ? (
        <p>You haven't favorited any items yet.</p>
      ) : (
        <ul>
          {favoritesList.map((product) => (
            <li key={product.fdcId} style={{ borderBottom: "1px solid #ccc", marginBottom: "10px", paddingBottom: "10px" }}>
              <h3>{product.name}</h3>
              <p>Brand: {product.brandOwner || product.brandName || 'N/A'}</p>
              <button onClick={() => removeFromFavorites(product.fdcId)} style={{ color: "red" }}>
                Remove from Favorites
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FavoritesList;