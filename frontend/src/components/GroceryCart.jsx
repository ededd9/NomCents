// src/components/GroceryCart.jsx
import React from 'react';

// Accept toggleChecked prop
const GroceryCart = ({ cartValue,weekTotal, cartItems, incrementQuantity, decrementQuantity, removeItem, toggleChecked }) => {

  return (
      <div>
              <h2>Total: ${cartValue.toFixed(2)}</h2>
              <h3>Weekly Budget remaining: ${weekTotal.toFixed(2)}</h3>

        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <ul>
            {cartItems.map((product) => (
              // Ensure product exists before rendering li
              product && product.fdcId && (
                <li key={product.fdcId} style={{ display: "flex",alignItems: "center", marginBottom: "10px", paddingBottom: '10px', borderBottom: '1px solid #000'}}> {/* Added padding/border */}
                    {/* --- Checkbox for check-off feature --- */}
                    <input
                        type="checkbox"
                        checked={product.isChecked || false} // Handle potentially undefined isChecked
                        onChange={() => toggleChecked(product.fdcId)}
                        style={{ marginRight: "10px", cursor: 'pointer', flexShrink: 0 }} // Prevent checkbox from shrinking
                    />
                    {/* --- End Checkbox --- */}

                    {/* --- Item Details (Name, Brand, and Price) --- */}
                    <div style={{ // Use a div to allow block elements inside
                        flexGrow: 1, // Allow text to take available space
                        textDecoration: product.isChecked ? 'line-through' : 'none',
                        opacity: product.isChecked ? 0.6 : 1,
                        transition: 'opacity 0.3s ease, text-decoration 0.3s ease', // Smooth transition
                        marginRight: '300px', // Add margin before quantity buttons
                    }}>
                        {/* Product Name/Description */}
                        <span style={{ fontWeight: 'bold' }}>
                            {product.name || product.description || `Item FDC ID: ${product.fdcId}`}
                        </span>
                        {/* Brand Name - Display if available */}
                        {(product.brandOwner || product.brandName) && ( // Check if brand exists
                             <span style={{ display: 'block', fontSize: '0.9em', color: 'black' }}> {/* Style for brand */}
                                Brand: {product.brandOwner || product.brandName}
                            </span>
                        )}
                        {/* Price - Display if available */}
                        {product.price && (
                          <span style={{ display: "block", fontSize: "0.9em", color: "black" }}>
                            Price: ${product.price.toFixed(2)}
                          </span>
                        )}
                    </div>
                    {/* --- End Item Details --- */}

                    {/* --- Quantity Buttons --- */}
                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}> {/* Wrap buttons to prevent shrinking */}
                        <button
                            onClick={() => decrementQuantity(product.fdcId)}
                            disabled={product.quantity <= 1 || product.isChecked} // Disable if quantity is 1 or item is checked
                            style={{ margin: "0 5px" , color: "white", background:"black"}} // Adjusted margin
                        >
                            -
                        </button>
                        <span style={{ minWidth: '20px', textAlign: 'center' }}>{product.quantity}</span> {/* Ensure space for quantity */}
                        <button
                            onClick={() => incrementQuantity(product.fdcId)}
                            disabled={product.isChecked} // Disable if item is checked
                            style={{ margin: "0 5px", color: "white", background:"black"}} // Adjusted margin
                        >
                            +
                        </button>
                    </div>
                    {/* --- End Quantity Buttons --- */}

                    {/* --- Remove Button --- */}
                    <button
                        onClick={() => removeItem(product.fdcId)}
                        style={{ marginLeft: "10px", color: "white", flexShrink: 0, background:"black" }} // Prevent shrinking
                    >
                        Remove From Grocery List
                    </button>
                     {/* --- End Remove Button --- */}
                </li>
              )
            ))}
          </ul>
        )}
      </div>
    );
  };

  export default GroceryCart;