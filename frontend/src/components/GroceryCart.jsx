const GroceryCart = ({ cartItems, incrementQuantity, decrementQuantity, removeItem }) => {

  return (
      <div>
        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <ul>
            {cartItems.map(item => (
              <li key={item.id} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <img src={item.image} alt={item.name} style={{ width: "80px", height: "80px", marginRight: "10px" }} />
                <p>{item.name}</p>
                <button onClick={() => decrementQuantity(item.id)}>-</button>
                <span style={{ margin: "0 10px" }}>{item.quantity}</span>
                <button onClick={() => incrementQuantity(item.id)}>+</button>
                <button onClick={() => removeItem(item.id)} style={{ marginLeft: "10px", color: "red" }}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };
  
  export default GroceryCart;
  