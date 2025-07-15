import React, { useState, useContext } from "react";
import { LoginContext } from "../contexts/LoginContext";

const BACKEND_API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

const SpendingLogger = ({ onSpendingLogged, selectedDate }) => {
  const { user, isLoggedIn } = useContext(LoginContext);
  const [currentSpending, setCurrentSpending] = useState("");
  const [description, setDescription] = useState(""); // Optional description
  const [logStatus, setLogStatus] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const handleLogSpending = async (e) => {
    e.preventDefault();
    if (!isLoggedIn || !user?.email || !currentSpending) {
      setLogStatus("Please log in and enter a spending amount.");
      return;
    }
    setIsLogging(true);
    setLogStatus("Logging...");

    try {
      const response = await fetch(`${BACKEND_API_URL}/user/spending_log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount: currentSpending,
          description, // Optional description
          date: selectedDate,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        setLogStatus(`Success: ${result.message}`);
        console.log("Selected Date:", selectedDate);
        setCurrentSpending("");
        setDescription("");
        if (onSpendingLogged) {
          onSpendingLogged(); // Callback to refresh chart
        }
      } else {
        setLogStatus(`Error: ${result.message || "Failed to log spending"}`);
      }
    } catch (error) {
      console.error("Logging error:", error);
      setLogStatus("Error: Could not connect to server.");
    } finally {
      setIsLogging(false);
    }
  };

  if (!isLoggedIn) {
    return <p>Please log in to record your spending.</p>;
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
      <h4>Log Your Spending</h4>
      <form onSubmit={handleLogSpending}>
        <label htmlFor="spendingInput" style={{ marginRight: "10px" }}>
          Spending ($):
        </label>
        <input
          type="number"
          id="spendingInput"
          value={currentSpending}
          onChange={(e) => setCurrentSpending(e.target.value)}
          placeholder={`e.g., 50`}
          step="0.01"
          required
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <label htmlFor="descriptionInput" style={{ marginRight: "10px" }}>
          Description (Optional):
        </label>
        <input
          type="text"
          id="descriptionInput"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Groceries"
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <button type="submit" disabled={isLogging || !currentSpending}>
          {isLogging ? "Logging..." : "Log Spending"}
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

export default SpendingLogger;
