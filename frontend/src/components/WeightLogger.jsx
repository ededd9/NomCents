// src/components/WeightLogger.jsx
import React, { useState, useContext } from "react";
import { LoginContext } from "../contexts/LoginContext";

const BACKEND_API_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api";

const WeightLogger = ({ onWeightLogged, userProfile, selectedDate }) => {
  const { user, isLoggedIn } = useContext(LoginContext);
  const [currentWeight, setCurrentWeight] = useState("");
  const [logStatus, setLogStatus] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const handleLogWeight = async (e) => {
    e.preventDefault();
    if (!isLoggedIn || !user?.email || !currentWeight) {
      setLogStatus("Please log in and enter a weight.");
      return;
    }
    setIsLogging(true);
    setLogStatus("Logging...");

    try {
      const response = await fetch(`${BACKEND_API_URL}/user/weight_log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          weight: currentWeight,
          date: selectedDate,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        setLogStatus(`Success: ${result.message}`);
        setCurrentWeight("");
        if (onWeightLogged) {
          onWeightLogged(); // Callback to refresh chart
        }
      } else {
        setLogStatus(`Error: ${result.message || "Failed to log weight"}`);
      }
    } catch (error) {
      console.error("Logging error:", error);
      setLogStatus("Error: Could not connect to server.");
    } finally {
      setIsLogging(false);
    }
  };

  if (!isLoggedIn) {
    return <p>Please log in to record your weight.</p>;
  }

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        border: "1px solid #eee",
        borderRadius: "5px",
      }}
    >
      <h4>Log Your Current Weight</h4>
      <form onSubmit={handleLogWeight}>
        <label htmlFor="weightInput" style={{ marginRight: "10px" }}>
          Weight ({userProfile?.units || "Enter unit in profile"}):
        </label>
        <input
          type="number"
          id="weightInput"
          value={currentWeight}
          onChange={(e) => setCurrentWeight(e.target.value)}
          placeholder={`e.g., 150`}
          step="0.1"
          required
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <button type="submit" disabled={isLogging || !currentWeight}>
          {isLogging ? "Logging..." : "Log Weight"}
        </button>
      </form>
      {logStatus && (
        <p style={{ marginTop: "10px" }}>
          <small>{logStatus}</small>
        </p>
      )}
    </div>
  );
};

export default WeightLogger;
