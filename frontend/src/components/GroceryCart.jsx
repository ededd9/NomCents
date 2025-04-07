const GroceryCart = ({ cartItems, incrementQuantity, decrementQuantity, removeItem }) => {

  return (
      <div>
        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <ul>
            {cartItems.map((product) => (
              <li key={product.fdcId} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <p>{product.name}</p>
                <button onClick={() => decrementQuantity(product.fdcId)}>-</button>
                <span style={{ margin: "0 10px" }}>{product.quantity}</span>
                <button onClick={() => incrementQuantity(product.fdcId)}>+</button>
                <button onClick={() => removeItem(product.fdcId)} style={{ marginLeft: "10px", color: "blue" }}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };
  
  export default GroceryCart;
  