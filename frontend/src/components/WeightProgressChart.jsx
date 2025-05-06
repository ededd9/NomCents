// src/components/WeightProgressChart.jsx
import React from 'react'; // Removed useState, useEffect, useContext as data comes via props
import { Line } from 'react-chartjs-2';
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

const WeightProgressChart = ({ chartData, userProfile, isLoading, error }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Weight Progress vs Target', font: { size: 16 } },
            tooltip: {
                enabled: true,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed.y !== null) {
                            label += `${context.parsed.y} ${userProfile?.units || ''}`;
                        }
                        return label;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: false,
                title: { display: true, text: `Weight (${userProfile?.units || 'N/A'})` },
            },
            x: {
                title: { display: true, text: 'Date' },
            },
        },
        interaction: { mode: 'index', intersect: false },
    };

    return (
        <div style={{ position: 'relative', height: '400px', width: '100%', paddingBottom:'10px'}}>
            {isLoading && <p>Loading chart...</p>}
            {!isLoading && error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {!isLoading && !error && (!chartData.labels || chartData.labels.length === 0) && (
                <p>No weight data logged yet. Add your current weight to start tracking!</p>
            )}
            {!isLoading && !error && chartData.labels && chartData.labels.length > 0 && (
                <Line options={options} data={chartData} />
            )}
        </div>
    );
};

export default WeightProgressChart;