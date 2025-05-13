import React, { useEffect, useState, useContext } from 'react';
import { Line } from 'react-chartjs-2';
import { LoginContext } from '../contexts/LoginContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const BACKEND_API_URL = "http://127.0.0.1:5000/api";

const SpendingProgressChart = () => {
    const { user, isLoggedIn } = useContext(LoginContext);
    const [chartData, setChartData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSpendingData = async () => {
            if (!isLoggedIn || !user?.email) return;

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${BACKEND_API_URL}/user/spending_logs?email=${user.email}`);
                const result = await response.json();

                if (response.ok) {
                    // Process the backend response to prepare chart data
                    const labels = Object.keys(result.logs); // Dates as labels
                    const values = labels.map(date => {
                        const dailyLogs = result.logs[date];
                        return dailyLogs.reduce((sum, log) => sum + log.amount, 0); // Sum of amounts per day
                    });

                    setChartData({
                        labels,
                        datasets: [
                            {
                                label: 'Spending ($)',
                                data: values,
                                borderColor: 'rgba(75, 192, 192, 1)',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                tension: 0.1,
                            },
                        ],
                    });
                } else {
                    console.error("Error fetching spending data:", result.message);
                    setError(result.message || "Failed to fetch spending data.");
                }
            } catch (error) {
                console.error("Error fetching spending data:", error);
                setError("An error occurred while fetching spending data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSpendingData();
    }, [isLoggedIn, user]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Spending Progress', font: { size: 16 } },
            tooltip: {
                enabled: true,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed.y !== null) {
                            label += `$${context.parsed.y.toFixed(2)}`;
                        }
                        return label;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Spending ($)' },
            },
            x: {
                title: { display: true, text: 'Date' },
            },
        },
        interaction: { mode: 'index', intersect: false },
    };

    return (
        <div style={{ position: 'relative', height: '400px', width: '100%', paddingBottom: '10px' }}>
            {isLoading && <p>Loading spending data...</p>}
            {!isLoading && error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {!isLoading && !error && (!chartData || !chartData.labels || chartData.labels.length === 0) && (
                <p>No spending data logged yet. Start tracking your spending!</p>
            )}
            {!isLoading && !error && chartData && chartData.labels && chartData.labels.length > 0 && (
                <Line options={options} data={chartData} />
            )}
        </div>
    );
};

export default SpendingProgressChart;