import React, { useState, useEffect, useContext } from 'react';
import WeightLogger from '../components/WeightLogger';
import SpendingLogger from '../components/SpendingLogger';
import { LoginContext } from '../contexts/LoginContext';
import './LogsPage.css';

// combined with pie import
import { Bar, Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

// register the chart functionalities
ChartJS.register(
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartDataLabels
);

const BACKEND_API_URL = "http://127.0.0.1:5000/api";

const LogsPage = () => {
  const { user, isLoggedIn } = useContext(LoginContext);
  const [foodLogs, setFoodLogs] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [spendingLogs, setSpendingLogs] = useState([]);

  // set a default to 1500 calories if there is no BMR calculated
  const dailyCal = parseFloat(localStorage.getItem("dailyCal")) || 1500;

  // formats the date so it looks nicer :)
  // had to update bc days weren't being displayed correctly

  const formatDate = (isoDate) => {
    const [year, month, day] = isoDate.split("-");
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  

  // compare to user's dailyCal, if they dont have one, use default 1500
  const getCaloriesData = (dailyCal) => {
    const total = foodLogs[selectedDate]?.dailyTotals?.calories ?? 0;

    return {
      labels: [selectedDate],
      datasets: [
        {
          label: "Calories",
          data: [total],
          backgroundColor:
            total > dailyCal
              ? "rgba(255, 99, 132, 0.6)" // red if over dailyCal
              : "rgba(75, 192, 192, 0.6)", // blue if under dailyCal
        },
      ],
    };
  };
  
  const handleDeleteFoodLog = async (mealType, index) => {
    if (!user?.email || !selectedDate) return;
    try {
      const res = await fetch(`${BACKEND_API_URL}/food_logs/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          date: selectedDate,
          meal: mealType,
          index: index,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        const updatedRes = await fetch(`${BACKEND_API_URL}/food_logs?email=${user.email}`);
        const updatedData = await updatedRes.json();
        setFoodLogs(updatedData.logs || {});
      } else {
        console.error("Failed to delete food log:", result.message);
      }
    } catch (err) {
      console.error("Error deleting food log:", err);
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user?.email) return;
      const res = await fetch(`${BACKEND_API_URL}/food_logs?email=${user.email}`);
      const data = await res.json();
      setFoodLogs(data.logs || {});
    };

    const fetchWeightLogs = async () => {
      const response = await fetch(`${BACKEND_API_URL}/user/weight_history?email=${user.email}`);
      const result = await response.json();
      if (response.ok) {
        const filteredLogs = result.labels
          .map((label, index) => ({
            date: label,
            weight: result.data[index],
          }))
          .filter((log) => log.date === selectedDate);
        setWeightLogs(filteredLogs);
      }
    };

    const fetchSpendingLogs = async () => {
      const response = await fetch(`${BACKEND_API_URL}/user/spending_logs?date=${selectedDate}&email=${user.email}`);
      const result = await response.json();
      if (response.ok) {
        setSpendingLogs(result.logs || []);
      }
    };

    if (isLoggedIn) {
      fetchLogs();
      fetchWeightLogs();
      fetchSpendingLogs();
    }
  }, [user, isLoggedIn, selectedDate]);

  if (!isLoggedIn) return <p>Please log in to view your logs.</p>;

  return (
    <div className='LogsPage' style={{ padding: "20px" }}>
      <div className='Logs-content-frame'>
        <h2>Logs Page</h2>

        <label htmlFor="datePicker" style={{ marginRight: "10px" }}>
          Select Date:
        </label>
        <input
          type="date"
          id="datePicker"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <hr />

        <h3>Calories for {formatDate(selectedDate)}</h3>
        {foodLogs[selectedDate]?.dailyTotals ? (
          <Bar
            data={getCaloriesData(dailyCal)}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: { display: false },
                y: { beginAtZero: true },
              },
            }}
          />
        ) : (
          <p>No calorie data for this date.</p>
        )}

          {foodLogs[selectedDate] ? (
          <div style={{ marginTop: "30px" }}>
              <h3>{formatDate(selectedDate)}</h3>

              {foodLogs[selectedDate].dailyTotals && (
              <p>
                  <strong>Totals:</strong>{" "}
                  {foodLogs[selectedDate].dailyTotals.calories ?? 0} kcal,{" "}
                  {foodLogs[selectedDate].dailyTotals.protein ?? 0}g protein,{" "}
                  {foodLogs[selectedDate].dailyTotals.fat ?? 0}g fat,{" "}
                  {foodLogs[selectedDate].dailyTotals.carbohydrates ?? 0}g carbs
              </p>
              )}

  {foodLogs[selectedDate].meals &&
              Object.entries(foodLogs[selectedDate].meals).map(([meal, foods]) => (
                <div
                  key={meal}
                  style={{
                    backgroundColor: "#fdfdfd",
                    padding: "18px",
                    marginBottom: "20px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                  }}
                >
                  <h4 style={{
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    marginBottom: "10px",
                    borderBottom: "1px solid #ccc",
                    paddingBottom: "5px"
                  }}>
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </h4>
                  <ul style={{ listStyle: "none", paddingLeft: "0", margin: "0" }}>
                    {foods.map((item, index) => (
                      <li
                        key={index}
                        style={{
                          padding: "6px 0",
                          borderBottom: "1px solid #eee",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span>
                          <strong>{item.productName}</strong>{" "}
                          <span style={{ color: "#555" }}>
                            - {item.servingAmount} {item.servingUnit}
                          </span>
                        </span>
                        <button
                          onClick={() => handleDeleteFoodLog(meal, index)}
                          style={{
                            backgroundColor: "#ff4d4f",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: "0.8rem"
                          }}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
          ) : (
          <p>No food logs for this date.</p>
          )}


        <hr />

        <h3>Weight Logs for {formatDate(selectedDate)}</h3>
        {weightLogs.length > 0 ? (
          <ul>
            {weightLogs.map((log, index) => (
              <li key={index}>{log.weight} lbs</li>
            ))}
          </ul>
        ) : (
          <p>No weight logs for this date.</p>
        )}
        <WeightLogger onWeightLogged={() => {}} selectedDate={selectedDate} />

        <h3>Spending Logs for {formatDate(selectedDate)}</h3>
        {spendingLogs.length > 0 ? (
          <ul>
            {spendingLogs.map((log, index) => (
              <li key={index}>
                {log.description || "N/A"} - ${log.amount}
              </li>
            ))}
          </ul>
        ) : (
          <p>No spending logs for this date.</p>
        )}
        <SpendingLogger
          onSpendingLogged={() => {}}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
};

export default LogsPage;
