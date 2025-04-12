import { useState } from "react";
import "./FoodLogModal.css";

const FoodLogModal = ({ product, onClose, onSubmit }) => {
  const [servingSize, setServingSize] = useState("");
  const [mealType, setMealType] = useState("breakfast");

  const handleSubmit = () => {
    if (!servingSize) return alert("Please enter a serving size!");
    onSubmit({
      fdcId: product.fdcId,
      productName: product.name, // to match the backend expected field name
      servingSize,
      mealType,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Food Log</h3>
        <p>{product.name}</p>

        <label>Serving Size:</label>
        <input
          type="text"
          value={servingSize}
          onChange={(e) => setServingSize(e.target.value)}
        />

        <label>Meal Type:</label>
        <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snacks">Snacks</option>
        </select>

        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default FoodLogModal;