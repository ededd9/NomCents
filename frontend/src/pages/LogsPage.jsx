import React, { useState, useEffect, useContext } from 'react';
import WeightLogger from '../components/WeightLogger';
import SpendingLogger from '../components/SpendingLogger';
import { LoginContext } from '../contexts/LoginContext';
import './LogsPage.css';

const BACKEND_API_URL = "http://127.0.0.1:5000/api";

const LogsPage = () => {
    const { user, isLoggedIn } = useContext(LoginContext); // Access user and login status from context
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [foodLogs, setFoodLogs] = useState({});
    const [weightLogs, setWeightLogs] = useState([]);
    const [spendingLogs, setSpendingLogs] = useState([]);

    // Fetch food logs for the selected date
    
    const fetchFoodLogs = async () => {
        if (!user?.email) return;
        try {
            const res = await fetch(`${BACKEND_API_URL}/food_logs?email=${user.email}&date=${selectedDate}`);
            const data = await res.json();
            setFoodLogs(data.logs || {}); // Set logs for the selected date
        } catch (error) {
            console.error("Error fetching food logs:", error);
        }
    };

    // Fetch weight logs for the selected date
    const fetchWeightLogs = async () => {
        if (!isLoggedIn || !user?.email) return; // Ensure the user is logged in
        try {
            const response = await fetch(`${BACKEND_API_URL}/user/weight_history?email=${user.email}`);
            const result = await response.json();

            if (response.ok) {
                // Filter weight logs for the selected date
                const filteredLogs = result.labels
                    .map((label, index) => ({
                        date: label,
                        weight: result.data[index],
                    }))
                    .filter((log) => log.date === selectedDate);
                setWeightLogs(filteredLogs);
            } else {
                console.error("Error fetching weight logs:", result.message);
            }
        } catch (error) {
            console.error("Error fetching weight logs:", error);
        }
    };

    // Fetch spending logs for the selected date
    const fetchSpendingLogs = async (date) => {
        if (!isLoggedIn || !user?.email) return; // Ensure the user is logged in
        try {
            const response = await fetch(`${BACKEND_API_URL}/user/spending_logs?date=${date}&email=${user.email}`);
            const result = await response.json();

            if (response.ok) {
                setSpendingLogs(result.logs || []); // Assuming the backend returns { logs: [...] }
            } else {
                console.error("Error fetching spending logs:", result.message);
            }
        } catch (error) {
            console.error("Error fetching spending logs:", error);
        }
    };

    // Fetch all logs when the selected date changes
    useEffect(() => {
        if (isLoggedIn) {
            fetchFoodLogs();
            fetchWeightLogs();
            fetchSpendingLogs(selectedDate);
        }
    }, [selectedDate, isLoggedIn]);

    // If the user is not logged in, display a message
    if (!isLoggedIn) {
        return <p>Please log in to view your logs.</p>;
    }

    return (
        <div className='LogsPage' style={{ padding: '20px' }}>
            <h2>Logs Page</h2>

            {/* Date Selector */}
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="datePicker" style={{ marginRight: '10px' }}>Select Date:</label>
                <input
                    type="date"
                    id="datePicker"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
            </div>

            {/* Display Logs for Selected Date */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Logs for {selectedDate}</h3>

                {/* Food Logs */}
                <div>
                    <h4>Food Logs for {selectedDate}:</h4>
                    {Object.keys(foodLogs).length === 0 ? (
                        <p>No logs yet.</p>
                    ) : (
                        Object.entries(foodLogs).map(([meal, foods]) => (
                            <div key={meal}>
                                <strong>{meal.toUpperCase()}</strong>
                                <ul>
                                    {foods.map((item, index) => {
                                        console.log("Food item:", item); // Debug log
                                        return (
                                            <li key={index}>
                                                {item.productName} – {item.servingAmount} {item.servingUnit}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))
                    )}
                </div>

                {/* Weight Logs */}
                <div>
                    <h4>Weight Logs:</h4>
                    {weightLogs.length > 0 ? (
                        <ul>
                            {weightLogs.map((log, index) => (
                                <li key={index}>
                                    {log.weight} lbs
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No weight logs for this date.</p>
                    )}
                </div>

                {/* Add Weight Log Form */}
                <div style={{ marginTop: '20px' }}>
                    <h4>Add Weight Log:</h4>
                    <WeightLogger onWeightLogged={fetchWeightLogs} selectedDate={selectedDate} />
                </div>

                {/* Spending Logs */}
                <div style={{ marginTop: '20px' }}>
                    <h4>Spending Logs:</h4>
                    {spendingLogs.length > 0 ? (
                        <ul>
                            {spendingLogs.map((log, index) => (
                                <li key={index}>
                                    {log.description || 'N/A'} - ${log.amount} 
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No spending logs for this date.</p>
                    )}
                </div>

                {/* Add Spending Log Form */}
                <div style={{ marginTop: '20px' }}>
                    <h4>Add Spending Log:</h4>
                    <SpendingLogger onSpendingLogged={() => fetchSpendingLogs(selectedDate)} selectedDate={selectedDate}/>
                </div>
            </div>
        </div>
    );
};

export default LogsPage;