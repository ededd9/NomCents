import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

const SpendingProgressChart = ({ weeklyDates, weeklySpending, weeklyBudget }) => {
    const data = {
        labels: weeklyDates,
        datasets: [
            {
                label: 'Cumulative Spending ($)',
                data: weeklySpending,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2,
                tension: 0.4, // Smooth curve
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointBorderColor: 'rgba(255, 99, 132, 1)',
                pointRadius: 4,
            },
            {
                label: 'Weekly Budget ($)',
                data: Array(weeklyDates.length).fill(weeklyBudget),
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                borderDash: [5, 5], // Dashed line for budget
                tension: 0, // Straight line
                pointRadius: 0, // No points for the budget line
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true },
            title: { display: true, text: 'Weekly Spending Progress' },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Amount ($)' },
            },
        },
    };

    return (
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
            <Line data={data} options={options} />
        </div>
    );
};

export default SpendingProgressChart;