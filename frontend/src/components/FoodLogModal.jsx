import { useState } from "react";
import './FoodLogModal.css'; // Import CSS file for styling

const FoodLogModal = ({ product, onClose, onSubmit }) => {
  const [servingAmount, setServingAmount] = useState("");
  const [servingUnit, setServingUnit] = useState("g"); // set grams as default value
  const [mealType, setMealType] = useState("breakfast");

  // convert macros to grams so that an accurate calorie count can be calculated
  const convertToGrams = (amount, unit) => {
    const amt = parseFloat(amount);
    if (isNaN(amt)) return null;

    switch (unit) {
      case "g": return amt;
      case "oz": return amt * 28.35;
      case "lb": return amt * 453.6;
      case "fl oz": return amt * 29.57;
      case "each": return amt * 100;    // per item estimate is around 100g
      default: return null;
    }
  }

  const handleSubmit = () => {
    if (!servingAmount) return alert("Please enter a serving size!"); 

    const amountInGrams = convertToGrams(servingAmount, servingUnit);
    if (!amountInGrams) return alert("Invalid serving input");

    const baseGrams = 100; // USDA data is typically per 100g
    const scaleFactor = amountInGrams / baseGrams;

    const scaledNutrition = { ...product.nutrition };

    // scale the alr known macros
    ["calories", "protein", "fat", "carbohydrates", "sugars"].forEach((key) => {
      const original = parseFloat(scaledNutrition[key]);
      if (!isNaN(original)) {
        // updated macros to be rounded, whole numbers
        scaledNutrition[key] = Math.round(original * scaleFactor);
      } else {
        scaledNutrition[key] = null;
      }
    });

    // scale the vitamin values
    if (scaledNutrition.vitamins) {
      const newVitamins = {};
      for (const [name, value] of Object.entries(scaledNutrition.vitamins)) {
        const val = parseFloat(value);
        if (!isNaN(val)){
          newVitamins[name] = Math.round(value * scaleFactor);
        }
      }
      scaledNutrition.vitamins = newVitamins;
    }

    onSubmit({
      fdcId: product.fdcId,
      productName: product.name, // to match the backend expected field name
      servingAmount,    // ex. 150
      servingUnit,      // ex. "oz"
      mealType,
      timestamp: new Date().toISOString(),
      nutrition: scaledNutrition // need to send this instead of just product.nutrition
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Food Log</h3>
        <p>{product.name}</p>

        <label>Serving Size:</label>
        <input
          type="number"
          value={servingAmount}
          onChange={(e) => setServingAmount(e.target.value)}
        />

        <label>Unit:</label>
        <select value={servingUnit} onChange={(e) => setServingUnit(e.target.value)}>
          <option value="g">grams (g)</option>
          <option value="oz">ounces (oz)</option>
          <option value="lb">pounds (lb)</option>
          <option value="fl oz">fluid ounces (fl oz)</option>
          <option value="each">each</option>  {/*for items best measured as a count*/}
        </select>

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